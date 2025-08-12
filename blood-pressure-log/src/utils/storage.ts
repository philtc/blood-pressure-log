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
    const headers = 'Date,Systolic,Diastolic,Pulse,Notes\n';
    const csvRows = readings.map(reading => 
      `"${reading.date}",${reading.systolic},${reading.diastolic},${reading.pulse || ''},"${reading.notes || ''}"`
    );
    return headers + csvRows.join('\n');
  }
}

export const storageService = new StorageService();
export type { BloodPressureReading };
