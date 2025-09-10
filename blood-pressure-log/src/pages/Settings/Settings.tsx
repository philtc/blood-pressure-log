import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, 
  IonButtons, IonList, IonItem, IonLabel,
  IonToggle, IonButton, IonIcon, useIonToast, IonAlert,
  IonListHeader, IonNote, IonInput, IonText
} from '@ionic/react';
import { moon, sunny, trashOutline, downloadOutline, cloudUploadOutline, arrowBack } from 'ionicons/icons';
import { storageService } from '../../utils/storage';
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import { Share } from '@capacitor/share';
import './Settings.css';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [present] = useIonToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const history = useHistory();

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const { value } = await Preferences.get({ key: 'darkMode' });
    setDarkMode(value === 'true');
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark', newDarkMode);
    await Preferences.set({ key: 'darkMode', value: String(newDarkMode) });
  };

  const exportData = async () => {
    try {
      const csv = await storageService.exportToCSV();
      const fileName = `blood-pressure-export-${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Use the Share plugin to share the CSV content
      await Share.share({
        title: fileName,
        text: csv,
        dialogTitle: 'Export Blood Pressure Data'
      });
      
      present({
        message: 'Blood pressure data export initiated. Choose an app to save the file.',
        duration: 4000,
        color: 'success'
      });
    } catch {
      present({
        message: 'Failed to export data. Please try again.',
        duration: 4000,
        color: 'danger'
      });
    }
  };

  const deleteAllData = async () => {
    try {
      await storageService['store']?.clear();
      present({
        message: 'All data deleted',
        duration: 2000,
        color: 'success'
      });
    } catch {
      present({
        message: 'Failed to delete data',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      try {
        await storageService.importFromCSV(file);
        present({
          message: 'Data imported successfully',
          duration: 2000,
          color: 'success'
        });
      } catch {
        present({
          message: 'Failed to import data',
          duration: 2000,
          color: 'danger'
        });
      }
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.push('/');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon slot="icon-only" icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonListHeader>
            <IonLabel>Appearance</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonIcon slot="start" icon={darkMode ? sunny : moon} />
            <IonLabel>
              <h3>Appearance</h3>
              <IonNote>Current: {darkMode ? 'Dark' : 'Light'}</IonNote>
            </IonLabel>
            <IonToggle 
              checked={darkMode} 
              onIonChange={toggleDarkMode} 
              aria-label="Dark mode toggle"
            />
          </IonItem>
          
          <IonListHeader>
            <IonLabel>Data Management</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonIcon slot="start" icon={downloadOutline} />
            <IonLabel>
              <h3>Export Data</h3>
              <IonNote>Export your readings as a CSV file</IonNote>
            </IonLabel>
            <IonButton 
              fill="clear" 
              onClick={exportData}
              aria-label="Export data"
            >
              Export
            </IonButton>
          </IonItem>
          
          <IonItem>
            <IonIcon slot="start" icon={cloudUploadOutline} />
            <IonLabel>
              <h3>Import Data</h3>
              <IonNote>Import readings from a CSV file</IonNote>
            </IonLabel>
            <input 
              type="file" 
              id="import-file" 
              accept=".csv" 
              style={{ display: 'none' }}
              onChange={handleFileImport}
            />
            <IonButton 
              fill="clear" 
              onClick={() => document.getElementById('import-file')?.click()}
              aria-label="Import data"
            >
              Import
            </IonButton>
          </IonItem>
          
          <IonItem lines="full">
            <IonIcon slot="start" icon={trashOutline} color="danger" />
            <IonLabel>
              <h3>Delete All Data</h3>
              <IonNote>This cannot be undone</IonNote>
            </IonLabel>
            <IonButton 
              fill="clear" 
              color="danger" 
              onClick={() => setShowDeleteAlert(true)}
              aria-label="Delete all data"
            >
              Delete All
            </IonButton>
          </IonItem>
        </IonList>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete All Data"
          message="Are you sure you want to delete all your blood pressure records? This cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', handler: deleteAllData, cssClass: 'danger' }
          ]}
        />

        <div className="ion-text-center ion-padding version-info">
          <IonText color="medium">
            <small>Version 1.0.5</small>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
