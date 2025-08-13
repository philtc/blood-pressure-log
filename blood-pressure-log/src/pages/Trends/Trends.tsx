import React, { useState, useEffect, useMemo } from 'react';
import { 
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, 
  IonButtons, IonBackButton, IonLoading, IonSegment, 
  IonSegmentButton, IonLabel, IonButton, IonIcon, IonAlert,
  IonCard, IonCardHeader, IonCardContent, IonText
} from '@ionic/react';
import { informationCircleOutline, refreshOutline } from 'ionicons/icons';
import { storageService, BloodPressureReading } from '../../utils/storage';
import { format, subDays, isWithinInterval, endOfDay } from 'date-fns';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, 
  ChartOptions, ChartData
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import './Trends.css';

// Register ChartJS components and plugins
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  zoomPlugin
);

type TimeRange = 'week' | 'month' | '3months' | 'year';

const Trends: React.FC = () => {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Load readings when component mounts
  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      setLoading(true);
      setError(null);
      const allReadings = await storageService.getReadings();
      if (!allReadings || allReadings.length === 0) {
        setError('No blood pressure readings found. Add some readings to see trends.');
      }
      setReadings(allReadings);
    } catch (error) {
      console.error('Error loading readings:', error);
      setError('Failed to load readings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter readings based on selected time range
  const filteredReadings = useMemo(() => {
    if (!readings || readings.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week': startDate = subDays(now, 7); break;
      case 'month': startDate = subDays(now, 30); break;
      case '3months': startDate = subDays(now, 90); break;
      case 'year': startDate = subDays(now, 365); break;
      default: startDate = subDays(now, 30);
    }

    const filtered = readings
      .filter((reading) => {
        try {
          return isWithinInterval(new Date(reading.timestamp), {
            start: startDate,
            end: endOfDay(now)
          });
        } catch (e) {
          console.error('Error processing reading:', reading, e);
          return false;
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    console.log(`Filtered ${filtered.length} readings for ${timeRange} time range`);
    return filtered;
  }, [readings, timeRange]);

  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: filteredReadings.map(r => format(new Date(r.timestamp), 'MMM d')),
    datasets: [
      {
        label: 'Systolic',
        data: filteredReadings.map(r => r.systolic),
        borderColor: 'var(--ion-color-primary)',
        backgroundColor: 'rgba(var(--ion-color-primary-rgb), 0.1)',
        borderWidth: 2,
        tension: 0.3,
        pointBackgroundColor: 'var(--ion-color-primary)',
        pointBorderColor: '#fff',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'var(--ion-color-primary)',
        pointHoverBorderColor: '#fff',
        pointHitRadius: 10,
        pointBorderWidth: 2,
      },
      {
        label: 'Diastolic',
        data: filteredReadings.map(r => r.diastolic),
        borderColor: 'var(--ion-color-secondary)',
        backgroundColor: 'rgba(var(--ion-color-secondary-rgb), 0.1)',
        borderWidth: 2,
        tension: 0.3,
        pointBackgroundColor: 'var(--ion-color-secondary)',
        pointBorderColor: '#fff',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'var(--ion-color-secondary)',
        pointHoverBorderColor: '#fff',
        pointHitRadius: 10,
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(var(--ion-color-medium-rgb), 0.2)',
        },
        title: { display: true, text: 'Blood Pressure (mmHg)' },
        min: 50,
        max: 200
      },
    },
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'var(--ion-color-step-50)',
        titleColor: 'var(--ion-text-color)', 
        bodyColor: 'var(--ion-text-color)',
        borderColor: 'var(--ion-color-medium-shade)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} mmHg`;
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        },
      },
    },
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Trends</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={loadReadings}>
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
            <IonButton onClick={() => setShowInfo(true)}>
              <IonIcon slot="icon-only" icon={informationCircleOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar className="ion-no-padding">
          <IonSegment 
            value={timeRange} 
            onIonChange={e => setTimeRange(e.detail.value as TimeRange)}
            scrollable
            style={{
              '--background': 'var(--ion-color-light)',
              '--background-checked': 'var(--ion-color-primary)',
              '--color': 'var(--ion-color-medium)',
              '--color-checked': 'var(--ion-color-primary-contrast)',
              '--indicator-color': 'var(--ion-color-primary)',
              '--padding-top': '8px',
              '--padding-bottom': '8px',
            }}
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

      <IonContent className="ion-padding-horizontal">
        <IonLoading isOpen={loading} message="Loading..." />
        
        {error ? (
          <IonCard className="ion-text-center ion-padding">
            <IonCardHeader>
              <IonText color="medium">
                <h3>{error}</h3>
              </IonText>
            </IonCardHeader>
            <IonCardContent>
              <IonButton 
                routerLink="/add" 
                routerDirection="forward"
                color="primary"
              >
                Add Your First Reading
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : filteredReadings.length === 0 ? (
          <IonCard className="ion-text-center ion-padding">
            <IonCardHeader>
              <IonText color="medium">
                <h3>No data available for the selected time range</h3>
              </IonText>
            </IonCardHeader>
            <IonCardContent>
              <IonButton 
                onClick={() => setTimeRange('month')}
                color="medium"
                fill="outline"
                className="ion-margin-end"
              >
                Reset Time Range
              </IonButton>
              <IonButton 
                routerLink="/add" 
                routerDirection="forward"
                color="primary"
              >
                Add New Reading
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : (
          <div style={{ 
            height: '60vh', 
            width: '100%',
            marginTop: '16px',
            backgroundColor: 'var(--ion-color-light)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <Line 
              data={chartData} 
              options={chartOptions} 
              style={{ width: '100%', height: '100%' }}
            />
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
