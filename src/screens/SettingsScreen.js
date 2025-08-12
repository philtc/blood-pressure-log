import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, ScrollView, Alert, Platform } from 'react-native';
import { Text, Button, useTheme, Divider, List, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useDatabase } from '../context/DatabaseContext';
import notifications from '../utils/notifications';

const SettingsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { exportReadings } = useDatabase();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load reminder settings on component mount
  useEffect(() => {
    const loadReminderSettings = async () => {
      try {
        const [isEnabled, time] = await Promise.all([
          notifications.checkReminderStatus(),
          notifications.getReminderTime(),
        ]);
        setReminderEnabled(isEnabled);
        setReminderTime(time);
      } catch (error) {
        console.error('Error loading reminder settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReminderSettings();
  }, []);

  const handleReminderToggle = async (value) => {
    try {
      setReminderEnabled(value);
      
      if (value) {
        // If enabling, use the current reminder time or default
        const time = reminderTime || '20:00';
        const success = await notifications.scheduleDailyReminder(time);
        if (!success) {
          setReminderEnabled(false);
          Alert.alert('Permission Required', 'Please enable notifications to set reminders.');
        } else {
          setReminderTime(time);
        }
      } else {
        // If disabling, cancel all notifications
        await notifications.cancelAllReminders();
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      setReminderEnabled(!value); // Revert the toggle on error
      Alert.alert('Error', 'Failed to update reminder settings. Please try again.');
    }
  };

  const handleTimeChange = async (newTime) => {
    try {
      setReminderTime(newTime);
      setShowTimePicker(false);
      
      if (reminderEnabled) {
        // If reminders are enabled, update the scheduled notification
        const success = await notifications.scheduleDailyReminder(newTime);
        if (!success) {
          setReminderEnabled(false);
          Alert.alert('Permission Required', 'Please enable notifications to set reminders.');
        }
      }
    } catch (error) {
      console.error('Error updating reminder time:', error);
      Alert.alert('Error', 'Failed to update reminder time. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const csvData = await exportReadings();
      
      if (!csvData) {
        Alert.alert('Error', 'No data to export');
        return;
      }
      
      const fileUri = `${FileSystem.documentDirectory}blood_pressure_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing is not available on this device');
        return;
      }
      
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Blood Pressure Data',
        UTI: 'public.comma-separated-values-text',
      });
      
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    setShowConfirmClear(false);
    // Implementation for clearing data would go here
    // This would typically involve calling a method from your database context
    Alert.alert('Not Implemented', 'Data clearing functionality will be implemented in a future update.');
  };



  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(
          <Picker.Item key={timeString} label={timeString} value={timeString} />
        );
      }
    }
    return times;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            left={props => <List.Icon {...props} icon="theme-light-dark" />}
            right={props => (
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                color={theme.colors.primary}
              />
            )}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Reminders</List.Subheader>
          <List.Item
            title="Daily Reminder"
            description={reminderEnabled ? `Reminder set for ${reminderTime}` : 'No reminder set'}
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => (
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                color={theme.colors.primary}
                disabled={isLoading}
              />
            )}
          />
          
          {reminderEnabled && (
            <List.Item
              title="Reminder Time"
              description="Set the time for daily reminders"
              left={props => <List.Icon {...props} icon="clock" />}
              right={props => (
                <Button 
                  mode="outlined" 
                  onPress={() => setShowTimePicker(true)}
                  style={styles.timeButton}
                  disabled={isLoading}
                >
                  {reminderTime}
                </Button>
              )}
            />
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Data</List.Subheader>
          <List.Item
            title="Export Data"
            description="Export your blood pressure data as CSV"
            left={props => <List.Icon {...props} icon="file-export" />}
            onPress={handleExportData}
            disabled={isExporting}
            right={props => isExporting ? <ActivityIndicator /> : null}
          />
          
          <List.Item
            title="Clear All Data"
            description="Permanently delete all your readings"
            left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
            titleStyle={{ color: theme.colors.error }}
            onPress={() => setShowConfirmClear(true)}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Privacy Policy"
            left={props => <List.Icon {...props} icon="shield-account" />}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <List.Item
            title="Terms of Service"
            left={props => <List.Icon {...props} icon="file-document" />}
            onPress={() => navigation.navigate('TermsOfService')}
          />
        </List.Section>
      </ScrollView>

      {/* Time Picker Modal */}
      <Portal>
        <Modal
          visible={showTimePicker}
          onDismiss={() => setShowTimePicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.modalTitle}>Select Reminder Time</Text>
            <Picker
              selectedValue={reminderTime}
              onValueChange={handleTimeChange}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {generateTimeOptions()}
            </Picker>
            <Button 
              mode="contained" 
              onPress={() => setShowTimePicker(false)}
              style={styles.modalButton}
            >
              Done
            </Button>
          </View>
        </Modal>

        {/* Confirm Clear Data Modal */}
        <Modal
          visible={showConfirmClear}
          onDismiss={() => setShowConfirmClear(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.modalTitle}>Clear All Data</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete all your blood pressure readings? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setShowConfirmClear(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleClearData}
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                labelStyle={{ color: 'white' }}
              >
                Delete All
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeButton: {
    marginRight: 8,
  },
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    margin: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  picker: {
    width: '100%',
  },
  pickerItem: {
    height: 120,
  },
});

export default SettingsScreen;
