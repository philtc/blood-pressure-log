import { setupIonicReact, isPlatform, IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

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

  return (
    <IonApp>
      <IonReactRouter>
        <Layout />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
