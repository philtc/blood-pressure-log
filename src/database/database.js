import SQLite from 'react-native-sqlite-storage';

// Enable SQLite debugging in development
SQLite.enablePromise(true);

const DATABASE_NAME = 'bloodpressure.db';
const DATABASE_VERSION = '1.0';
const DATABASE_DISPLAY_NAME = 'Blood Pressure Database';
const DATABASE_SIZE = 200000; // Size in KB

let database = null;

const getDatabase = async () => {
  if (database) return database;

  try {
    database = await SQLite.openDatabase(
      {
        name: DATABASE_NAME,
        location: 'default',
        createFromLocation: '~www/bloodpressure.db',
      },
      () => {
        console.log('Database opened successfully');
      },
      (error) => {
        console.error('Error opening database', error);
      }
    );

    // Initialize database tables
    await initDatabase(database);
    return database;
  } catch (error) {
    console.error('Error getting database', error);
    throw error;
  }
};

const initDatabase = async (db) => {
  // Create readings table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      systolic INTEGER NOT NULL,
      diastolic INTEGER NOT NULL,
      pulse INTEGER,
      notes TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      category TEXT,
      createdAt TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Create settings table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Initialize default settings if not exists
  await db.executeSql(`
    INSERT OR IGNORE INTO settings (key, value) 
    VALUES ('reminder_enabled', 'false'),
           ('reminder_time', '20:00'),
           ('theme', 'system')
  `);
};

const addReading = async (reading) => {
  try {
    const db = await getDatabase();
    const { systolic, diastolic, pulse, notes, date, time, category } = reading;
    
    const [result] = await db.executeSql(
      `INSERT INTO readings 
       (systolic, diastolic, pulse, notes, date, time, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [systolic, diastolic, pulse || null, notes || null, date, time, category || 'general']
    );
    
    return result.insertId;
  } catch (error) {
    console.error('Error adding reading', error);
    throw error;
  }
};

const getReadings = async (limit = 100) => {
  try {
    const db = await getDatabase();
    const [results] = await db.executeSql(
      `SELECT * FROM readings 
       ORDER BY date DESC, time DESC 
       LIMIT ?`,
      [limit]
    );
    
    const readings = [];
    for (let i = 0; i < results.rows.length; i++) {
      readings.push(results.rows.item(i));
    }
    
    return readings;
  } catch (error) {
    console.error('Error getting readings', error);
    throw error;
  }
};

const deleteReading = async (id) => {
  try {
    const db = await getDatabase();
    await db.executeSql('DELETE FROM readings WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting reading', error);
    throw error;
  }
};

const exportReadings = async () => {
  try {
    const readings = await getReadings(1000); // Get all readings, adjust limit as needed
    
    // Convert to CSV format
    const headers = 'Systolic,Diastolic,Pulse,Date,Time,Category,Notes\n';
    const csvRows = readings.map(reading => {
      return [
        `"${reading.systolic}"`,
        `"${reading.diastolic}"`,
        `"${reading.pulse || ''}"`,
        `"${reading.date}"`,
        `"${reading.time}"`,
        `"${reading.category || ''}"`,
        `"${(reading.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    
    return headers + csvRows.join('\n');
  } catch (error) {
    console.error('Error exporting readings', error);
    throw error;
  }
};

export default {
  getDatabase,
  addReading,
  getReadings,
  deleteReading,
  exportReadings,
};
