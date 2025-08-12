import React, { createContext, useContext, useState, useEffect } from 'react';
import database from '../database/database';

export const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  const [readings, setReadings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReadings = async () => {
    try {
      setIsLoading(true);
      const data = await database.getReadings();
      setReadings(data);
      setError(null);
    } catch (err) {
      console.error('Error loading readings:', err);
      setError('Failed to load readings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addReading = async (reading) => {
    try {
      await database.addReading(reading);
      await loadReadings();
      return true;
    } catch (err) {
      console.error('Error adding reading:', err);
      setError('Failed to add reading. Please try again.');
      return false;
    }
  };

  const deleteReading = async (id) => {
    try {
      await database.deleteReading(id);
      await loadReadings();
      return true;
    } catch (err) {
      console.error('Error deleting reading:', err);
      setError('Failed to delete reading. Please try again.');
      return false;
    }
  };

  const exportReadings = async () => {
    try {
      return await database.exportReadings();
    } catch (err) {
      console.error('Error exporting readings:', err);
      setError('Failed to export readings. Please try again.');
      return null;
    }
  };

  // Load readings on initial render
  useEffect(() => {
    loadReadings();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        readings,
        isLoading,
        error,
        addReading,
        deleteReading,
        exportReadings,
        refreshReadings: loadReadings,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
