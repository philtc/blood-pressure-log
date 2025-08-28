import React from 'react';
import { IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Menu from '../Menu/Menu';

/* Pages */
import Home from '../../pages/Home/Home';
import AddReading from '../../pages/AddReading/AddReading';
import History from '../../pages/History/History';
import Trends from '../../pages/Trends/Trends';
import Settings from '../../pages/Settings/Settings';

const Layout: React.FC = () => {

  return (
    <IonSplitPane contentId="main-content">
      <Menu />
      <IonRouterOutlet id="main-content">
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/home" />} />
          <Route exact path="/home" component={Home} />
          <Route exact path="/add" component={AddReading} />
          <Route exact path="/history" component={History} />
          <Route exact path="/trends" component={Trends} />
          <Route exact path="/settings" component={Settings} />
          <Route render={() => <Redirect to="/home" />} />
        </Switch>
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default Layout;
