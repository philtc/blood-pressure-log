import { setupIonicReact, isPlatform, IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

/* Components */
import Layout from './components/Layout/Layout';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/typography.css';

/* Theme variables */
import './theme/variables.css';
import './App.css';

// Initialize Ionic
setupIonicReact({
  mode: 'md', // Force material design for consistent look
  hardwareBackButton: isPlatform('android') ? true : false,
});

// Initialize theme based on saved preference
const initializeTheme = async () => {
  try {
    const { value } = await Preferences.get({ key: 'darkMode' });
    const isDarkMode = value === 'true';
    document.body.classList.toggle('dark', isDarkMode);
  } catch (error) {
    console.warn('Failed to load theme preference:', error);
  }
};

// Initialize theme on app startup
initializeTheme();

// Initialize Status Bar on native platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark }).catch(err => {
    console.warn('Failed to set status bar style:', err);
  });
  
  // Ensure status bar is visible and properly positioned
  StatusBar.setOverlaysWebView({ overlay: false }).catch(err => {
    console.warn('Failed to set status bar overlay:', err);
  });
}

// Initialize AdMob on native platforms with improved error handling
if (Capacitor.isNativePlatform()) {
  import('@capacitor-community/admob')
    .then(async (admob) => {
      try {
        const AdMob = admob.AdMob || admob;
        // Add a small delay to ensure the app is fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        const result = await AdMob.initialize();
        console.log('AdMob initialized successfully', result);
      } catch (error) {
        console.warn('AdMob initialization failed:', error);
      }
    })
    .catch((error) => console.warn('AdMob plugin not available:', error));
}

const App: React.FC = () => {

  return (
    <IonApp>
      <IonReactRouter>
        <Layout />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;