import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import database from '../database/database';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
const requestPermissionsAsync = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      // If permission is denied, open app settings
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, {
          data: 'package:com.bloodpressurelog.app',
        });
      }
      return false;
    }
    return true;
  }
  return false;
};

// Schedule a daily reminder notification
const scheduleDailyReminder = async (timeString) => {
  try {
    const hasPermission = await requestPermissionsAsync();
    if (!hasPermission) return false;

    // Cancel any existing reminders
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Parse the time string (format: 'HH:MM')
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object for the notification time
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Create a notification trigger (daily at the specified time)
    const trigger = {
      hour: hours,
      minute: minutes,
      repeats: true,
    };

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to log your blood pressure!',
        body: 'Keep track of your health by logging your daily reading.',
        data: { type: 'daily-reminder' },
      },
      trigger,
    });

    // Save reminder settings to the database
    const db = await database.getDatabase();
    await db.executeSql(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['reminder_enabled', 'true']
    );
    await db.executeSql(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      ['reminder_time', timeString]
    );

    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
};

// Cancel all scheduled notifications
const cancelAllReminders = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Update database
    const db = await database.getDatabase();
    await db.executeSql(
      'UPDATE settings SET value = ? WHERE key = ?',
      ['false', 'reminder_enabled']
    );
    
    return true;
  } catch (error) {
    console.error('Error canceling notifications:', error);
    return false;
  }
};

// Check if reminders are enabled
const checkReminderStatus = async () => {
  try {
    const db = await database.getDatabase();
    const [result] = await db.executeSql(
      'SELECT value FROM settings WHERE key = ?',
      ['reminder_enabled']
    );
    
    if (result.rows.length > 0) {
      return result.rows.item(0).value === 'true';
    }
    return false;
  } catch (error) {
    console.error('Error checking reminder status:', error);
    return false;
  }
};

// Get the reminder time
const getReminderTime = async () => {
  try {
    const db = await database.getDatabase();
    const [result] = await db.executeSql(
      'SELECT value FROM settings WHERE key = ?',
      ['reminder_time']
    );
    
    if (result.rows.length > 0) {
      return result.rows.item(0).value || '20:00'; // Default to 8:00 PM
    }
    return '20:00';
  } catch (error) {
    console.error('Error getting reminder time:', error);
    return '20:00';
  }
};

// Initialize notifications
const initializeNotifications = async () => {
  try {
    // This is required for Android to receive notifications in the foreground
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Check if we have a reminder set
    const isReminderEnabled = await checkReminderStatus();
    if (isReminderEnabled) {
      const time = await getReminderTime();
      await scheduleDailyReminder(time);
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

export default {
  requestPermissionsAsync,
  scheduleDailyReminder,
  cancelAllReminders,
  checkReminderStatus,
  getReminderTime,
  initializeNotifications,
};
