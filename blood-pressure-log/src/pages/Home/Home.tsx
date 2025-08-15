import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonPage, IonButtons, IonButton, IonIcon, IonMenuButton, useIonViewWillEnter } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import BloodPressureCard from '../../components/BloodPressureCard';
import { storageService, BloodPressureReading } from '../../utils/storage';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const [latest, setLatest] = useState<BloodPressureReading | null>(null);

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
      <IonContent className="ion-padding">
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
}
;

export default Home;
