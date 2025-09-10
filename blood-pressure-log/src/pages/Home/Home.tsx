import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonPage, IonButtons, IonButton, IonIcon, IonMenuButton, useIonViewWillEnter, useIonViewDidLeave } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import BloodPressureCard from '../../components/BloodPressureCard';
import { storageService, BloodPressureReading } from '../../utils/storage';
import { admobService } from '../../utils/admob';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const [latest, setLatest] = useState<BloodPressureReading | null>(null);
  const [adHeight, setAdHeight] = useState<number>(0);

  const goToAdd = () => history.push('/add');

  const loadLatest = async () => {
    const readings = await storageService.getReadings();
    if (readings && readings.length > 0) {
      const newest = readings.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
      setLatest(newest);
    } else {
      setLatest(null);
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  useIonViewWillEnter(() => {
    loadLatest();
    
    // AdMob setup with improved error handling
    void (async () => {
      try {
        // Initialize AdMob service if not already initialized
        await admobService.initialize();
        
        // Show bottom adaptive banner
        const height = await admobService.showBanner();
        setAdHeight(height);
        console.log('AdMob banner shown with height:', height);
      } catch (err) {
        console.warn('AdMob banner failed to show:', err);
        setAdHeight(0);
      }
    })();
  });

  useIonViewDidLeave(() => {
    // Hide banner when leaving the page
    void (async () => {
      try {
        await admobService.hideBanner();
        setAdHeight(0);
      } catch (err) {
        console.warn('AdMob banner failed to hide:', err);
        setAdHeight(0);
      }
    })();
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton autoHide={false} menu="main-menu" />
          </IonButtons>
          <IonTitle>Blood Pressure Log</IonTitle>
          <IonButtons slot="end">
            <IonButton aria-label="Add reading" onClick={goToAdd}>
              <IonIcon slot="icon-only" icon={add} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ paddingBottom: adHeight ? adHeight + 16 : 16 }}>
        <div className="content-container">
          {latest ? (
            <div className="latest-reading">
              <h3>Latest Reading</h3>
              <BloodPressureCard reading={latest} onDelete={() => setLatest(null)} />
              <div className="home-actions">
                <IonButton routerLink="/history" expand="block" color="medium">View History</IonButton>
                <IonButton onClick={goToAdd} expand="block">
                  <IonIcon slot="start" icon={add} />
                  Add Another
                </IonButton>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No readings yet</h3>
              <p>Add your first blood pressure reading to get started.</p>
              <IonButton expand="block" onClick={goToAdd}>
                <IonIcon slot="start" icon={add} />
                Add Reading
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;