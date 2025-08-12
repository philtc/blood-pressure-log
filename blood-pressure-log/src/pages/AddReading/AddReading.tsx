import React, { useState, useEffect } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonTextarea, 
  IonDatetime, 
  IonLoading,
  IonAlert,
  useIonViewWillEnter,
  useIonViewDidLeave,
  IonBackButton
} from '@ionic/react';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { storageService } from '../../utils/storage';
import './AddReading.css';

const AddReading: React.FC = () => {
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  // Reset form when entering the page
  useIonViewWillEnter(() => {
    resetForm();
  });

  // Clean up when leaving the page
  useIonViewDidLeave(() => {
    resetForm();
  });

  const resetForm = () => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNotes('');
    setDate(new Date().toISOString());
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!systolic || !diastolic) {
      setError('Both systolic and diastolic values are required');
      return false;
    }

    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);
    const pulseNum = pulse ? parseInt(pulse) : null;

    if (isNaN(systolicNum) || systolicNum < 50 || systolicNum > 250) {
      setError('Please enter a valid systolic value (50-250)');
      return false;
    }

    if (isNaN(diastolicNum) || diastolicNum < 30 || diastolicNum > 150) {
      setError('Please enter a valid diastolic value (30-150)');
      return false;
    }

    if (pulseNum !== null && (isNaN(pulseNum) || pulseNum < 30 || pulseNum > 200)) {
      setError('Please enter a valid pulse value (30-200) or leave it empty');
      return false;
    }

    if (systolicNum < diastolicNum) {
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
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        pulse: pulse ? parseInt(pulse) : undefined,
        notes: notes.trim() || undefined,
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

  const getPressureStatus = (systolicVal: string, diastolicVal: string) => {
    if (!systolicVal || !diastolicVal) return '';
    
    const sys = parseInt(systolicVal);
    const dia = parseInt(diastolicVal);
    
    if (isNaN(sys) || isNaN(dia)) return '';
    
    if (sys >= 140 || dia >= 90) return 'High Blood Pressure';
    if (sys >= 130 || dia >= 80) return 'Elevated Blood Pressure';
    if (sys >= 120) return 'Normal Blood Pressure';
    return 'Optimal Blood Pressure';
  };

  const status = getPressureStatus(systolic, diastolic);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Add Reading</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSubmit}>
              <IonIcon slot="icon-only" icon={checkmarkOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="reading-inputs">
            <div className="input-group">
              <IonItem>
                <IonLabel position="floating">Systolic (mmHg) *</IonLabel>
                <IonInput
                  type="number"
                  value={systolic}
                  onIonChange={e => setSystolic(e.detail.value || '')}
                  inputMode="numeric"
                  required
                />
              </IonItem>
              <div className="divider">/</div>
              <IonItem>
                <IonLabel position="floating">Diastolic (mmHg) *</IonLabel>
                <IonInput
                  type="number"
                  value={diastolic}
                  onIonChange={e => setDiastolic(e.detail.value || '')}
                  inputMode="numeric"
                  required
                />
              </IonItem>
            </div>

            {status && (
              <div className={`status-indicator ${status.toLowerCase().includes('high') ? 'high' : ''}`}>
                {status}
              </div>
            )}

            <IonItem>
              <IonLabel position="floating">Pulse (bpm)</IonLabel>
              <IonInput
                type="number"
                value={pulse}
                onIonChange={e => setPulse(e.detail.value || '')}
                inputMode="numeric"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Date & Time</IonLabel>
              <IonDatetime
                value={date}
                onIonChange={e => setDate(e.detail.value as string)}
                displayFormat="MMM D, YYYY h:mm A"
                pickerFormat="MMM D, YYYY h:mm A"
                doneText="Done"
                cancelText="Cancel"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Notes (optional)</IonLabel>
              <IonTextarea
                value={notes}
                onIonChange={e => setNotes(e.detail.value || '')}
                rows={3}
              />
            </IonItem>
          </div>

          <div className="ion-padding">
            <IonButton 
              expand="block" 
              type="submit"
              disabled={!systolic || !diastolic || isLoading}
            >
              Save Reading
            </IonButton>
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
