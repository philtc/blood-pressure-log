import React from 'react';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardSubtitle, 
  IonCardTitle, 
  IonCardContent,
  IonButton,
  IonIcon 
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { format } from 'date-fns';
import { BloodPressureReading } from '../utils/storage';

interface BloodPressureCardProps {
  reading: BloodPressureReading;
  onDelete?: (id: string) => void;
}

const BloodPressureCard: React.FC<BloodPressureCardProps> = ({ reading, onDelete }) => {
  const formattedDate = format(new Date(reading.timestamp), 'MMM d, yyyy h:mm a');

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardSubtitle style={{ fontSize: '0.9rem', color: 'var(--ion-color-medium)' }}>{formattedDate}</IonCardSubtitle>
        <IonCardTitle style={{ marginTop: '8px', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--ion-text-color)' }}>
          {reading.systolic} / {reading.diastolic} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>mmHg</span>
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          {reading.pulse && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--ion-color-medium)' }}>Pulse:</span>
              <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>{reading.pulse} bpm</span>
            </div>
          )}
          {onDelete && (
            <IonButton 
              fill="clear" 
              color="medium" 
              onClick={() => onDelete(reading.id)}
              style={{ '--padding-start': '8px', '--padding-end': '8px', marginLeft: 'auto' }}
            >
              <IonIcon slot="icon-only" icon={trashOutline} />
            </IonButton>
          )}
        </div>
        {reading.notes && (
          <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>
            <div style={{ color: 'var(--ion-color-medium)', marginBottom: '4px' }}>Notes:</div>
            <div style={{ color: 'var(--ion-text-color)' }}>{reading.notes}</div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default BloodPressureCard;
