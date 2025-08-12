import React, { useState, useEffect } from 'react';
import {
  IonSplitPane,
  IonRouterOutlet,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton
} from '@ionic/react';
import { Route, Redirect, useLocation } from 'react-router-dom';
import Menu from '../Menu/Menu';

/* Pages */
import Home from '../../pages/Home/Home';
import AddReading from '../../pages/AddReading/AddReading';
import History from '../../pages/History/History';
import Trends from '../../pages/Trends/Trends';
import Settings from '../../pages/Settings/Settings';

interface LayoutProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ darkMode, onToggleDarkMode }) => {
  const location = useLocation();
  const [currentTitle, setCurrentTitle] = useState('Blood Pressure Log');

  // Update title based on current route
  useEffect(() => {
    const path = location.pathname;
    switch (path) {
      case '/':
        setCurrentTitle('Blood Pressure Log');
        break;
      case '/add':
        setCurrentTitle('Add Reading');
        break;
      case '/history':
        setCurrentTitle('History');
        break;
      case '/trends':
        setCurrentTitle('Trends');
        break;
      case '/settings':
        setCurrentTitle('Settings');
        break;
      default:
        setCurrentTitle('Blood Pressure Log');
    }
  }, [location.pathname]);

  return (
    <IonSplitPane contentId="main">
      <Menu />
      
      <IonPage id="main">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>{currentTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <IonRouterOutlet>
            <Route exact path="/" component={Home} />
            <Route exact path="/add" component={AddReading} />
            <Route exact path="/history" component={History} />
            <Route exact path="/trends" component={Trends} />
            <Route exact path="/settings" component={Settings} />
            <Route exact path="/">
              <Redirect to="/" />
            </Route>
          </IonRouterOutlet>
        </IonContent>
      </IonPage>
    </IonSplitPane>
  );
};

export default Layout;
