import React, { useState, useEffect, useCallback } from 'react';
import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonRefresher, 
  IonRefresherContent, 
  IonSpinner,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonListHeader,
  IonAlert,
  useIonViewWillEnter,
  IonBackButton
} from '@ionic/react';
import { downloadOutline, trashOutline } from 'ionicons/icons';
import { storageService, BloodPressureReading } from '../../utils/storage';
import BloodPressureCard from '../../components/BloodPressureCard';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import './History.css';

type TimeRange = 'all' | 'today' | 'week' | 'month' | '3months' | 'year';

const History: React.FC = () => {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<BloodPressureReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [showDeleteAllAlert, setShowDeleteAllAlert] = useState(false);

  const loadReadings = useCallback(async () => {
    try {
      const allReadings = await storageService.getReadings();
      // Sort by most recent first
      const sortedReadings = allReadings.sort((a, b) => b.timestamp - a.timestamp);
      setReadings(sortedReadings);
      applyTimeFilter(sortedReadings, timeRange);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadReadings();
  }, [loadReadings]);

  useEffect(() => {
    applyTimeFilter(readings, timeRange);
  }, [readings, timeRange]);

  useIonViewWillEnter(() => {
    loadReadings();
  });

  const handleRefresh = async (event: CustomEvent) => {
    await loadReadings();
    event.detail.complete();
  };

  const applyTimeFilter = (readingsList: BloodPressureReading[], range: TimeRange) => {
    if (range === 'all') {
      setFilteredReadings(readingsList);
      return;
    }

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case '3months':
        startDate = subDays(now, 90);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = new Date(0);
    }

    const filtered = readingsList.filter(reading => {
      const readingDate = new Date(reading.timestamp);
      return isWithinInterval(readingDate, {
        start: startDate,
        end: endOfDay(now)
      });
    });

    setFilteredReadings(filtered);
  };

  const handleExport = async () => {
    try {
      const csvContent = await storageService.exportToCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `blood-pressure-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const confirmDeleteAll = () => {
    setShowDeleteAllAlert(true);
  };

  const handleDeleteAll = async () => {
    try {
      // Delete all readings by setting an empty array
      await storageService['store']?.set(storageService['STORAGE_KEY'], []);
      setReadings([]);
      setFilteredReadings([]);
    } catch (error) {
      console.error('Error deleting all readings:', error);
    }
  };

  const handleDeleteReading = async (id: string) => {
    try {
      await storageService.deleteReading(id);
      const updatedReadings = readings.filter(r => r.id !== id);
      setReadings(updatedReadings);
      applyTimeFilter(updatedReadings, timeRange);
    } catch (error) {
      console.error('Error deleting reading:', error);
    }
  };

  const getReadingDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, yyyy');
  };

  const groupReadingsByDate = () => {
    const groups: { [key: string]: BloodPressureReading[] } = {};
    
    filteredReadings.forEach(reading => {
      const date = getReadingDate(reading.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(reading);
    });
    
    return Object.entries(groups).map(([date, items]) => ({
      date,
      items
    }));
  };

  const groupedReadings = groupReadingsByDate();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>History</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleExport}>
              <IonIcon slot="icon-only" icon={downloadOutline} />
            </IonButton>
            <IonButton onClick={confirmDeleteAll}>
              <IonIcon slot="icon-only" icon={trashOutline} color="danger" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        
        <IonToolbar>
          <IonItem lines="none" className="filter-toolbar">
            <IonLabel>Time Range:</IonLabel>
            <IonSelect 
              value={timeRange} 
              onIonChange={e => setTimeRange(e.detail.value)}
              interface="popover"
              className="time-range-select"
            >
              <IonSelectOption value="today">Today</IonSelectOption>
              <IonSelectOption value="week">Last 7 Days</IonSelectOption>
              <IonSelectOption value="month">Last 30 Days</IonSelectOption>
              <IonSelectOption value="3months">Last 3 Months</IonSelectOption>
              <IonSelectOption value="year">Last Year</IonSelectOption>
              <IonSelectOption value="all">All Time</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className="ion-text-center ion-padding empty-state">
            <h3>No readings found</h3>
            <p>Try adjusting your filters or add a new reading</p>
            <IonButton routerLink="/add" className="add-button">
              Add Reading
            </IonButton>
          </div>
        ) : (
          <div className="readings-list">
            {groupedReadings.map((group) => (
              <div key={group.date} className="date-group">
                <IonListHeader lines="full" className="date-header">
                  <IonLabel>{group.date}</IonLabel>
                  <IonLabel slot="end" className="count">
                    {group.items.length} {group.items.length === 1 ? 'reading' : 'readings'}
                  </IonLabel>
                </IonListHeader>
                
                {group.items.map((reading) => (
                  <div key={reading.id} className="reading-item">
                    <BloodPressureCard 
                      reading={reading} 
                      onDelete={handleDeleteReading} 
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <IonAlert
          isOpen={showDeleteAllAlert}
          onDidDismiss={() => setShowDeleteAllAlert(false)}
          header="Delete All Readings"
          message="Are you sure you want to delete ALL readings? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary'
            },
            {
              text: 'Delete All',
              handler: handleDeleteAll,
              cssClass: 'danger'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default History;
