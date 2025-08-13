import React from 'react';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonPage, IonButtons, IonButton, IonIcon, IonMenuButton } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();

  const goToAdd = () => history.push('/add');

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
          {/* Empty state */}
          <div className="empty-state">
            <h3>No readings yet</h3>
            <p>Add your first blood pressure reading to get started.</p>
            <IonButton expand="block" onClick={goToAdd}>
              <IonIcon slot="start" icon={add} />
              Add Reading
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
;

export default Home;
