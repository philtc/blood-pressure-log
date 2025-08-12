import React from 'react';
import { 
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonIcon, 
  IonLabel,
  IonMenuToggle
} from '@ionic/react';
import { 
  homeOutline, 
  listOutline, 
  statsChartOutline, 
  settingsOutline, 
  addOutline,
  downloadOutline,
  cloudUploadOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';

interface MenuProps {
  // No props needed for now
}

const Menu: React.FC<MenuProps> = () => {
  const history = useHistory();
  const location = useLocation();

  const menuItems = [
    { title: 'Home', path: '/', icon: homeOutline },
    { title: 'Add Reading', path: '/add', icon: addOutline },
    { title: 'History', path: '/history', icon: listOutline },
    { title: 'Trends', path: '/trends', icon: statsChartOutline },
    { title: 'Settings', path: '/settings', icon: settingsOutline },
  ];

  const navigateTo = (path: string) => {
    history.push(path);
  };

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {menuItems.map((item) => (
            <IonMenuToggle key={item.path} autoHide={false}>
              <IonItem 
                routerLink={item.path} 
                routerDirection="none"
                detail={false}
                lines="none"
                className={location.pathname === item.path ? 'selected' : ''}
              >
                <IonIcon slot="start" icon={item.icon} />
                <IonLabel>{item.title}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
          
          <IonMenuToggle autoHide={false}>
            <IonItem 
              button 
              onClick={() => document.getElementById('import-file')?.click()}
              lines="none"
            >
              <IonIcon slot="start" icon={cloudUploadOutline} />
              <IonLabel>Import Data</IonLabel>
              <input 
                type="file" 
                id="import-file" 
                accept=".csv" 
                style={{ display: 'none' }}
                onChange={(e) => {
                  // Handle file import here
                  const file = e.target.files?.[0];
                  if (file) {
                    // Add import logic
                  }
                }}
              />
            </IonItem>
          </IonMenuToggle>
          
          <IonMenuToggle autoHide={false}>
            <IonItem 
              button 
              routerLink="/export" 
              routerDirection="none"
              lines="none"
            >
              <IonIcon slot="start" icon={downloadOutline} />
              <IonLabel>Export Data</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
