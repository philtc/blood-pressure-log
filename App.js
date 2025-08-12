import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, DefaultTheme, DarkTheme, IconButton } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, View } from 'react-native';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import AddReadingScreen from './src/screens/AddReadingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import { DatabaseProvider } from './src/context/DatabaseContext';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import notifications from './src/utils/notifications';

const Stack = createNativeStackNavigator();

const lightTheme = {
  ...DefaultTheme,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3f51b5',
    accent: '#ff4081',
    background: '#f8f9fa',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#dee2e6',
    notification: '#e91e63',
    error: '#dc3545',
    success: '#28a745',
    warning: '#ff9800',
    info: '#17a2b8',
    disabled: '#adb5bd',
    placeholder: '#6c757d',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  animation: {
    scale: 1.0,
  },
};

const darkTheme = {
  ...DarkTheme,
  roundness: 8,
  colors: {
    ...DarkTheme.colors,
    primary: '#7986cb',
    accent: '#ff80ab',
    background: '#121212',
    surface: '#1e1e1e',
    card: '#1e1e1e',
    text: '#f8f9fa',
    textSecondary: '#adb5bd',
    border: '#343a40',
    notification: '#f48fb1',
    error: '#f44336',
    success: '#4caf50',
    warning: '#ffb74d',
    info: '#4dd0e1',
    disabled: '#6c757d',
    placeholder: '#6c757d',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
  fonts: lightTheme.fonts,
  animation: lightTheme.animation,
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const App = () => {
  const scheme = useColorScheme();
  const [theme, setTheme] = useState(scheme === 'dark' ? darkTheme : lightTheme);
  const [isDarkMode, setIsDarkMode] = useState(scheme === 'dark');
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Initialize notifications and listeners
  useEffect(() => {
    // Set theme based on dark mode preference
    setTheme(isDarkMode ? darkTheme : lightTheme);

    // Initialize notifications
    const initializeApp = async () => {
      try {
        // Initialize notifications
        await notifications.initializeNotifications();
        
        // Check if we need to request permissions
        const isEnabled = await notifications.checkReminderStatus();
        if (isEnabled) {
          const time = await notifications.getReminderTime();
          await notifications.scheduleDailyReminder(time);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      // Handle notification tap if needed
    });

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={theme}>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ 
                  title: 'Blood Pressure Log',
                  headerRight: () => (
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton
                      icon="chart-line"
                      iconColor="#fff"
                      onPress={() => navigation.navigate('Trends')}
                    />
                    <IconButton
                      icon="cog"
                      iconColor="#fff"
                      onPress={() => navigation.navigate('Settings')}
                    />
                  </View>
                ),
                }} 
              />
              <Stack.Screen 
                name="AddReading" 
                component={AddReadingScreen} 
                options={{ title: 'Add Reading' }} 
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen} 
                options={{ title: 'Settings' }} 
              />
              <Stack.Screen 
                name="Trends" 
                component={TrendsScreen} 
                options={{ title: 'Trends & Analytics' }} 
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
};

export default App;
