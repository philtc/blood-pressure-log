import React, { useState, useEffect, useRef } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonButton, 
  IonIcon, 
  IonSpinner, 
  IonTextarea,
  IonPopover,
  IonDatetime,
  IonItem,
  IonLabel,
  IonButtons,
  IonAlert,
  IonLoading,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  useIonViewWillEnter,
  useIonViewDidLeave
} from '@ionic/react';
import ScrollPicker from '../../components/ScrollPicker';
import { calendarOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { close } from 'ionicons/icons';
import { storageService } from '../../utils/storage';
import './AddReading.css';
// AdMob (only active on native platforms)
import { Capacitor } from '@capacitor/core';

// Dynamic AdMob import to avoid build errors and reduce web bundle size
let AdMob: {
  initialize?: () => Promise<void>;
  addListener?: (event: string, callback: (info: { height: number }) => void) => { remove: () => void };
  showBanner?: (options: {
    adId: string;
    adSize: string;
    position: string;
    margin: number;
  }) => Promise<void>;
  hideBanner?: () => Promise<void>;
} | undefined;

try {
  // Dynamically import to avoid impacting web bundle
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const admobModule = require('@capacitor-community/admob') as typeof import('@capacitor-community/admob');
  AdMob = admobModule.AdMob || admobModule;
} catch {
  AdMob = undefined;
}

const AddReading: React.FC = () => {
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number | undefined>();
  const [arm, setArm] = useState<string>('Not specified');
  const [includePulse, setIncludePulse] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adHeight, setAdHeight] = useState<number>(0);
  const history = useHistory();
  const dateButtonRef = useRef<HTMLIonButtonElement>(null);

  const handleCancel = () => {
    history.push('/home');
  };

  // Load last reading and theme preference when component mounts
  useEffect(() => {
    const loadLastReading = async () => {
      try {
        const readings = await storageService.getReadings();
        if (readings.length > 0) {
          const lastReading = readings[0];
          setSystolic(lastReading.systolic);
          setDiastolic(lastReading.diastolic);
          if (lastReading.pulse) setPulse(lastReading.pulse);
        }
      } catch (error) {
        console.error('Error loading last values:', error);
      }
    };

    loadLastReading();
  }, []);

  // Load last reading and theme preference when component mounts
  useIonViewWillEnter(() => {
    const loadLastReading = async () => {
      try {
        const readings = await storageService.getReadings();
        if (readings.length > 0) {
          const lastReading = readings[0];
          setSystolic(lastReading.systolic);
          setDiastolic(lastReading.diastolic);
          if (lastReading.pulse) setPulse(lastReading.pulse);
        }
      } catch (error) {
        console.error('Error loading last values:', error);
      }
    };

    loadLastReading();
    // Check for dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(prefersDark.matches);

    // Listen for theme changes
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    prefersDark.addEventListener('change', handleThemeChange);
    return () => {
      prefersDark.removeEventListener('change', handleThemeChange);
    };
  });

  // AdMob setup only on native platforms and only on this page
  useIonViewWillEnter(() => {
    if (!Capacitor.isNativePlatform() || !AdMob) return;
    void (async () => {
      try {
        // Initialize AdMob SDK
        await AdMob.initialize?.();
        // Listen for adaptive banner height to avoid covering buttons
        const sub = AdMob.addListener?.('bannerSizeChanged', (info: { height: number }) => {
          if (info && typeof info.height === 'number') setAdHeight(info.height);
        });

        // Show bottom adaptive banner
        await AdMob.showBanner?.({
          adId: 'ca-app-pub-2130614856218928/8934846232',
          adSize: 'ADAPTIVE_BANNER',
          position: 'BOTTOM_CENTER',
          margin: 0,
        });

        // Fallback padding in case event doesn't fire immediately
        setTimeout(() => setAdHeight((h) => (h > 0 ? h : 60)), 500);

        // Store unsubscribe on ref for cleanup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__admob_sub__ = sub;
      } catch (err) {
        console.warn('AdMob banner failed to show:', err);
      }
    })();
  });

  useIonViewDidLeave(() => {
    // Hide banner when leaving the page
    void (async () => {
      try {
        if (AdMob?.hideBanner) await AdMob.hideBanner();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = (window as any).__admob_sub__;
        if (sub && typeof sub.remove === 'function') sub.remove();
        setAdHeight(0);
      } catch {
        // ignore
      }
    })();
  });

  // Clean up when leaving the page
  useIonViewDidLeave(() => {
    resetForm();
  });

  const resetForm = () => {
    setSystolic(120);
    setDiastolic(80);
    setPulse(undefined);
    setArm('Not specified');
    setIncludePulse(false);
    setNotes('');
    setDate(new Date().toISOString());
    setError(null);
  };

  const validateForm = (): boolean => {
    if (systolic < 50 || systolic > 250) {
      setError('Please enter a valid systolic value (50-250)');
      return false;
    }

    if (diastolic < 30 || diastolic > 150) {
      setError('Please enter a valid diastolic value (30-150)');
      return false;
    }

    if (includePulse && pulse !== undefined && (pulse < 30 || pulse > 200)) {
      setError('Please enter a valid pulse value (30-200)');
      return false;
    }

    if (systolic < diastolic) {
      setError('Systolic value must be higher than diastolic value');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await storageService.addReading({
        systolic,
        diastolic,
        pulse: includePulse ? pulse : undefined,
        arm: arm !== 'Not specified' ? arm : undefined,
        notes: notes.trim() || undefined
      });

      setShowSuccess(true);
      // Reset form after successful submission
      resetForm();
      // Navigate back to home after a short delay
      setTimeout(() => {
        setShowSuccess(false);
        history.push('/home');
      }, 1500);
    } catch (err) {
      console.error('Error saving reading:', err);
      setError('Failed to save reading. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <IonPage className={isDarkMode ? 'dark-theme' : ''}>
      <IonHeader className="app-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleCancel}>
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle className="app-title">Add Reading</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ paddingBottom: adHeight ? adHeight + 12 : undefined }}>
        <form onSubmit={(e) => e.preventDefault()} className="reading-form">
          <div className="reading-inputs">
            <div className="input-row">
              <div className="blood-pressure-inputs">
                <ScrollPicker
                  min={70}
                  max={200}
                  value={systolic}
                  onChange={setSystolic}
                  label="Systolic"
                  unit="mmHg"
                />

                <div className="divider">/</div>

                <ScrollPicker
                  min={40}
                  max={120}
                  value={diastolic}
                  onChange={setDiastolic}
                  label="Diastolic"
                  unit="mmHg"
                />
              </div>

              <div className="pulse-container">
                <IonItem lines="none" className="pulse-checkbox-item">
                  <IonCheckbox
                    checked={includePulse}
                    onIonChange={e => {
                      setIncludePulse(e.detail.checked);
                      if (!e.detail.checked) {
                        setPulse(undefined);
                      } else if (pulse === undefined) {
                        setPulse(72);
                      }
                    }}
                  />
                  <IonLabel className="ion-margin-start">Include Pulse Reading</IonLabel>
                </IonItem>
                {includePulse && (
                  <ScrollPicker
                    min={30}
                    max={200}
                    value={pulse || 72}
                    onChange={(val) => setPulse(val)}
                    label="Pulse"
                    unit="bpm"
                    color="secondary"
                  />
                )}
              </div>
            </div>

            <div className="date-picker-item">
              <div className="date-picker-label">Date & Time</div>
              <div className="date-picker-container">
                <IonButton 
                  fill="clear" 
                  onClick={() => setShowDatePicker(true)}
                  ref={dateButtonRef}
                  className="date-button"
                >
                  <span className="date-display">{formatDate(date)}</span>
                  <IonIcon slot="end" icon={calendarOutline} className="calendar-icon" />
                </IonButton>
                <IonPopover
                  isOpen={showDatePicker}
                  onDidDismiss={() => setShowDatePicker(false)}
                  reference="event"
                  event={dateButtonRef.current}
                  className="date-picker-popover"
                >
                  <IonDatetime
                    value={date}
                    onIonChange={e => {
                      setDate(e.detail.value as string);
                      setShowDatePicker(false);
                    }}
                    presentation="date-time"
                    showDefaultButtons
                    doneText="Done"
                    cancelText="Cancel"
                    className="custom-datetime"
                  />
                </IonPopover>
              </div>
            </div>

            <div className="arm-selection-container">
              <div className="arm-selection-label">Arm Used</div>
              <IonItem lines="none" className="arm-selection-item">
                <IonSelect
                  value={arm}
                  onIonChange={e => setArm(e.detail.value)}
                  interface="popover"
                  placeholder="Select arm"
                  className="arm-select"
                >
                  <IonSelectOption value="Not specified">Not specified</IonSelectOption>
                  <IonSelectOption value="Left">Left</IonSelectOption>
                  <IonSelectOption value="Right">Right</IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>

            <div className="notes-container">
              <div className="notes-label">Notes (optional)</div>
              <IonTextarea
                value={notes}
                onIonChange={e => setNotes(e.detail.value || '')}
                rows={3}
                className="notes-textarea"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          <div className="submit-button-container">
            <div className="form-actions">
              <IonButton 
                fill="outline"
                className="cancel-button"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </IonButton>
              <IonButton 
                expand="block" 
                className="submit-button" 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <IonSpinner name="crescent" />
                ) : (
                  'Save Reading'
                )}
              </IonButton>
            </div>
          </div>
        </form>

        <IonAlert
          isOpen={showSuccess}
          onDidDismiss={() => setShowSuccess(false)}
          header="Success"
          message="Blood pressure reading saved successfully!"
          buttons={['OK']}
        />

        <IonAlert
          isOpen={!!error}
          onDidDismiss={() => setError(null)}
          header="Error"
          message={error || 'An error occurred'}
          buttons={['OK']}
        />

        <IonLoading isOpen={isLoading} message="Saving reading..." />
      </IonContent>
    </IonPage>
  );
};

export default AddReading;
