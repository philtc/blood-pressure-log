import { Storage } from '@ionic/storage';
import { format } from 'date-fns';

type BloodPressureReading = {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  notes?: string;
  date: string;
  timestamp: number;
};

class StorageService {
  private store: Storage | null = null;
  private readonly STORAGE_KEY = 'bp_readings';

  constructor() {
    this.init();
  }

  async init() {
    this.store = new Storage();
    await this.store.create();
  }

  async addReading(reading: Omit<BloodPressureReading, 'id' | 'date' | 'timestamp'>) {
    if (!this.store) await this.init();
    
    const readings = await this.getReadings();
    const newReading: BloodPressureReading = {
      ...reading,
      id: Date.now().toString(),
      date: format(new Date(), 'yyyy-MM-dd'),
      timestamp: Date.now(),
    };
    
    await this.store?.set(this.STORAGE_KEY, [...readings, newReading]);
    return newReading;
  }

  async getReadings(): Promise<BloodPressureReading[]> {
    if (!this.store) await this.init();
    return (await this.store?.get(this.STORAGE_KEY)) || [];
  }

  async deleteReading(id: string) {
    if (!this.store) await this.init();
    const readings = await this.getReadings();
    const updatedReadings = readings.filter(reading => reading.id !== id);
    await this.store?.set(this.STORAGE_KEY, updatedReadings);
  }

  async exportToCSV(): Promise<string> {
    const readings = await this.getReadings();
    const headers = ['Date', 'Systolic', 'Diastolic', 'Pulse', 'Notes'];
    const rows = readings.map(reading => [
      new Date(reading.timestamp).toISOString(),
      reading.systolic,
      reading.diastolic,
      reading.pulse || '',
      reading.notes || ''
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
  }

  async importFromCSV(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            throw new Error('No file content');
          }
          
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          // Skip header row and process data rows
          const newReadings = lines.slice(1).map(line => {
            if (!line.trim()) return null;
            
            const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const reading: Omit<BloodPressureReading, 'id' | 'date' | 'timestamp'> = {
              systolic: parseInt(values[headers.indexOf('systolic')], 10),
              diastolic: parseInt(values[headers.indexOf('diastolic')], 10)
            };
            
            const pulseIndex = headers.indexOf('pulse');
            if (pulseIndex !== -1 && values[pulseIndex]) {
              reading.pulse = parseInt(values[pulseIndex], 10);
            }
            
            const notesIndex = headers.indexOf('notes');
            if (notesIndex !== -1 && values[notesIndex]) {
              reading.notes = values[notesIndex];
            }
            
            return reading;
          }).filter(Boolean);
          
          // Save all new readings
          for (const reading of newReadings) {
            if (reading) {
              await this.addReading(reading);
            }
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }
}

export const storageService = new StorageService();
export type { BloodPressureReading };
