import { setupIonicReact, isPlatform, IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect, useState } from 'react';
import { Preferences } from '@capacitor/preferences';

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

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { value } = await Preferences.get({ key: 'darkMode' });
        const prefersDark = value === 'true' || 
          (value === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        setDarkMode(prefersDark);
        document.body.classList.toggle('dark', prefersDark);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark', newDarkMode);
    await Preferences.set({ key: 'darkMode', value: String(newDarkMode) });
  };

  return (
    <IonApp>
      <IonReactRouter>
        <Layout darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
