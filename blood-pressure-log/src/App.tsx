import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, isPlatform } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { useEffect, useState } from 'react';
import { Preferences } from '@capacitor/preferences';

/* Pages */
import Home from './pages/Home/Home';
import AddReading from './pages/AddReading/AddReading';
import History from './pages/History/History';
import Trends from './pages/Trends/Trends';
import Settings from './pages/Settings/Settings';

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

  return (
    <IonApp className={darkMode ? 'dark' : ''}>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/home" component={Home} />
          <Route exact path="/add" component={AddReading} />
          <Route exact path="/history" component={History} />
          <Route exact path="/trends" component={Trends} />
          <Route exact path="/settings" component={Settings} />
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
