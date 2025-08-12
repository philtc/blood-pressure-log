import React from 'react';
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonBadge } from '@ionic/react';
import { format } from 'date-fns';
import { BloodPressureReading } from '../utils/storage';

interface BloodPressureCardProps {
  reading: BloodPressureReading;
  onDelete?: (id: string) => void;
}

const getPressureStatus = (systolic: number, diastolic: number) => {
  if (systolic >= 140 || diastolic >= 90) return { color: 'danger', label: 'High' };
  if (systolic >= 130 || diastolic >= 80) return { color: 'warning', label: 'Elevated' };
  if (systolic >= 120) return { color: 'tertiary', label: 'Normal' };
  return { color: 'success', label: 'Optimal' };
};

const BloodPressureCard: React.FC<BloodPressureCardProps> = ({ reading, onDelete }) => {
  const { color, label } = getPressureStatus(reading.systolic, reading.diastolic);
  const formattedDate = format(new Date(reading.timestamp), 'MMM d, yyyy h:mm a');

  return (
    <IonCard>
      <IonCardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IonCardSubtitle style={{ fontSize: '0.9rem' }}>{formattedDate}</IonCardSubtitle>
          <IonBadge color={color}>{label}</IonBadge>
        </div>
        <IonCardTitle style={{ marginTop: '8px', fontSize: '1.5rem' }}>
          {reading.systolic} / {reading.diastolic} mmHg
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {reading.pulse && (
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--ion-color-medium)' }}>Pulse:</span>{' '}
              <span style={{ fontWeight: '500' }}>{reading.pulse} bpm</span>
            </div>
          )}
          {onDelete && (
            <ion-button 
              fill="clear" 
              color="medium" 
              onClick={() => onDelete(reading.id)}
              style={{ '--padding-start': '8px', '--padding-end': '8px' }}
            >
              <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
            </ion-button>
          )}
        </div>
        {reading.notes && (
          <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>
            <div style={{ color: 'var(--ion-color-medium)', marginBottom: '4px' }}>Notes:</div>
            <div>{reading.notes}</div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default BloodPressureCard;
