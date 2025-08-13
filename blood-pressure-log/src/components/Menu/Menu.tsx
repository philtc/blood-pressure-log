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
  IonLabel
} from '@ionic/react';
import { 
  homeOutline, 
  listOutline, 
  statsChartOutline, 
  settingsOutline, 
  addOutline
} from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import './Menu.css';

interface MenuProps {
  // No props needed for now
}

const Menu: React.FC<MenuProps> = () => {
  const location = useLocation();

  const menuItems = [
    { title: 'Home', path: '/home', icon: homeOutline },
    { title: 'Add Reading', path: '/add', icon: addOutline },
    { title: 'History', path: '/history', icon: listOutline },
    { title: 'Trends', path: '/trends', icon: statsChartOutline },
    { title: 'Settings', path: '/settings', icon: settingsOutline },
  ];

  return (
    <IonMenu contentId="main-content" type="overlay" side="start" menuId="main-menu">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Menu</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent color="dark">
        <IonList>
          {menuItems.map((item) => (
            <IonItem
              key={item.path}
              routerLink={item.path}
              routerDirection="root"
              detail={false}
              lines="none"
              className={location.pathname === item.path ? 'selected' : ''}
            >
              <IonIcon slot="start" icon={item.icon} />
              <IonLabel>{item.title}</IonLabel>
            </IonItem>
          ))}
          

        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
