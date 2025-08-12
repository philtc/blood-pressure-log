import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonRefresher, IonRefresherContent, IonSpinner, IonAlert } from '@ionic/react';
import { addOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import BloodPressureCard from '../../components/BloodPressureCard';
import { storageService, BloodPressureReading } from '../../utils/storage';
import './Home.css';

const Home: React.FC = () => {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [readingToDelete, setReadingToDelete] = useState<string | null>(null);
  const history = useHistory();

  const loadReadings = async () => {
    try {
      const allReadings = await storageService.getReadings();
      console.log('All readings from storage:', allReadings);
      
      // Sort by most recent first
      const sortedReadings = allReadings.sort((a, b) => b.timestamp - a.timestamp);
      console.log('Sorted readings:', sortedReadings);
      
      setReadings(sortedReadings);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadings();
  }, []);

  const handleRefresh = async (event: CustomEvent) => {
    await loadReadings();
    event.detail.complete();
  };

  const confirmDelete = (id: string) => {
    setReadingToDelete(id);
    setShowDeleteAlert(true);
  };

  const handleDelete = async () => {
    if (!readingToDelete) return;
    
    try {
      await storageService.deleteReading(readingToDelete);
      setReadings(readings.filter(r => r.id !== readingToDelete));
    } catch (error) {
      console.error('Error deleting reading:', error);
    } finally {
      setShowDeleteAlert(false);
      setReadingToDelete(null);
    }
  };

  const getLatestReading = () => {
    if (readings.length === 0) return null;
    return readings[0];
  };

  const latestReading = getLatestReading();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Blood Pressure Log</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="ion-padding">
          {loading ? (
            <div className="ion-text-center ion-padding">
              <IonSpinner />
            </div>
          ) : readings.length === 0 ? (
            <div className="ion-text-center ion-padding">
              <h3>No readings yet</h3>
              <p>Add your first blood pressure reading to get started</p>
              <IonButton onClick={() => history.push('/add')}>
                Add Reading
              </IonButton>
            </div>
          ) : (
            <>
              <h2>Latest Reading</h2>
              {latestReading ? (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '16px', 
                    background: 'var(--ion-color-step-100)',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: 'bold', 
                      color: 'var(--ion-text-color)',
                      lineHeight: '1.2'
                    }}>
                      {latestReading.systolic} / {latestReading.diastolic}
                      <span style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'normal', 
                        color: 'var(--ion-color-medium)', 
                        marginLeft: '6px',
                        verticalAlign: 'middle'
                      }}>
                        mmHg
                      </span>
                    </div>
                    <div style={{ 
                      color: 'var(--ion-color-medium)', 
                      fontSize: '0.95rem', 
                      marginTop: '8px',
                      fontWeight: '500'
                    }}>
                      {new Date(latestReading.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <BloodPressureCard reading={latestReading} onDelete={confirmDelete} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ion-color-medium)' }}>
                  No readings available
                </div>
              )}

              {readings.length > 1 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px' }}>
                    <h2 style={{ margin: 0 }}>Recent Readings</h2>
                    <IonButton fill="clear" routerLink="/history">View All</IonButton>
                  </div>
                  {readings.slice(1, 4).map(reading => (
                    <div key={reading.id} style={{ marginBottom: '16px' }}>
                      <BloodPressureCard reading={reading} onDelete={confirmDelete} />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Reading"
          message="Are you sure you want to delete this reading?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary',
            },
            {
              text: 'Delete',
              handler: handleDelete,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
