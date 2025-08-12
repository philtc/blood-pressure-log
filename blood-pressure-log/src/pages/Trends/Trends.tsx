import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, 
  IonButtons, IonBackButton, IonLoading, IonSegment, 
  IonSegmentButton, IonLabel, IonButton, IonIcon, IonAlert
} from '@ionic/react';
import { informationCircleOutline } from 'ionicons/icons';
import { storageService } from '../../utils/storage';
import { format, subDays, isWithinInterval, endOfDay } from 'date-fns';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend 
} from 'chart.js';
import './Trends.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend
);

type TimeRange = 'week' | 'month' | '3months' | 'year';

const Trends: React.FC = () => {
  const [readings, setReadings] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Load readings when component mounts
  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      setLoading(true);
      const allReadings = await storageService.getReadings();
      setReadings(allReadings);
    } catch (error) {
      console.error('Error loading readings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter readings based on selected time range
  const filteredReadings = useMemo(() => {
    if (!readings.length) return [];
    
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week': startDate = subDays(now, 7); break;
      case 'month': startDate = subDays(now, 30); break;
      case '3months': startDate = subDays(now, 90); break;
      case 'year': startDate = subDays(now, 365); break;
      default: startDate = subDays(now, 30);
    }

    return readings
      .filter((reading: any) => isWithinInterval(new Date(reading.timestamp), {
        start: startDate,
        end: endOfDay(now)
      }))
      .sort((a: any, b: any) => a.timestamp - b.timestamp);
  }, [readings, timeRange]);

  // Prepare chart data
  const chartData = {
    labels: filteredReadings.map((r: any) => format(new Date(r.timestamp), 'MMM d')),
    datasets: [
      {
        label: 'Systolic',
        data: filteredReadings.map((r: any) => r.systolic),
        borderColor: 'rgba(220, 53, 69, 1)',
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Diastolic',
        data: filteredReadings.map((r: any) => r.diastolic),
        borderColor: 'rgba(0, 123, 255, 1)',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: {
        title: { display: true, text: 'Blood Pressure (mmHg)' },
        min: 50,
        max: 200
      }
    },
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Trends</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowInfo(true)}>
              <IonIcon icon={informationCircleOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        
        <IonToolbar>
          <IonSegment 
            value={timeRange} 
            onIonChange={e => setTimeRange(e.detail.value as TimeRange)}
          >
            <IonSegmentButton value="week">
              <IonLabel>Week</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="month">
              <IonLabel>Month</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="3months">
              <IonLabel>3 Months</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="year">
              <IonLabel>Year</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        ) : !filteredReadings.length ? (
          <div className="ion-text-center empty-state">
            <h3>No data available</h3>
            <p>Add some readings to see trends</p>
            <IonButton routerLink="/add">Add Reading</IonButton>
          </div>
        ) : (
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} height={300} />
          </div>
        )}

        <IonAlert
          isOpen={showInfo}
          onDidDismiss={() => setShowInfo(false)}
          header="About Blood Pressure Ranges"
          message={
            '• Normal: Below 120/80 mmHg\n' +
            '• Elevated: 120-129/<80 mmHg\n' +
            '• High (Stage 1): 130-139/80-89 mmHg\n' +
            '• High (Stage 2): 140+/90+ mmHg'
          }
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Trends;
