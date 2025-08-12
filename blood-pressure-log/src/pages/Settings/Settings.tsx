import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, 
  IonButtons, IonBackButton, IonList, IonItem, IonLabel,
  IonToggle, IonButton, IonIcon, useIonToast, IonAlert
} from '@ionic/react';
import { moon, sunny, trashOutline, downloadOutline } from 'ionicons/icons';
import { storageService } from '../../utils/storage';
import { Preferences } from '@capacitor/preferences';
import './Settings.css';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [present] = useIonToast();

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
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `blood-pressure-export-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      present({
        message: 'Data exported successfully',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      present({
        message: 'Failed to export data',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const confirmDelete = () => setShowDeleteAlert(true);

  const deleteAllData = async () => {
    try {
      await storageService['store']?.clear();
      present({
        message: 'All data deleted',
        duration: 2000,
        color: 'success'
      });
    } catch (error) {
      present({
        message: 'Failed to delete data',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonIcon slot="start" icon={darkMode ? moon : sunny} />
            <IonLabel>Dark Mode</IonLabel>
            <IonToggle 
              checked={darkMode} 
              onIonChange={toggleDarkMode} 
            />
          </IonItem>

          <IonItem button onClick={exportData}>
            <IonIcon slot="start" icon={downloadOutline} />
            <IonLabel>Export Data</IonLabel>
          </IonItem>

          <IonItem button onClick={confirmDelete} color="danger">
            <IonIcon slot="start" icon={trashOutline} />
            <IonLabel>Delete All Data</IonLabel>
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
      </IonContent>
    </IonPage>
  );
};

export default Settings;
