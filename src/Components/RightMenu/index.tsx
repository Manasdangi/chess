import React from 'react';
import styles from './RightMenu.module.scss';
import { ProfileDetails } from '../ProfileDetails';
import TnC from '../TnC';
import { PreviousGames } from '../PreviousGames';
import useAuthStore from '../../Context/useAuthStore';

interface RightSideMenuProps {
  onClose: () => void;
}

const RightSideMenu: React.FC<RightSideMenuProps> = ({ onClose }) => {
  const [activePage, setActivePage] = React.useState<'profile' | 'previousGames' | 'tnc' | null>(
    null
  );
  const logout = useAuthStore(state => state.logout);
  const setUser = useAuthStore(state => state.setUser);

  const handleLogout = () => {
    console.log('Logging out...');
    logout();
    setUser(null);
    onClose();
    alert('Logged out successfully');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'profile':
        return (
          <ProfileDetails
            onClose={() => {
              setActivePage(null);
            }}
          />
        );
      case 'previousGames':
        return (
          <PreviousGames
            onClose={() => {
              setActivePage(null);
            }}
          />
        );
      case 'tnc':
        return <TnC />;
      default:
        return (
          <div className={styles.accountSection}>
            <div className={styles.profileImageWrapper}>
              <img
                src="https://i.pravatar.cc/150?img=3"
                alt="Profile"
                className={styles.profileImage}
              />
            </div>
            <div
              className={styles.option}
              onClick={() => {
                setActivePage('profile');
              }}
            >
              Profile Details
            </div>
            <div
              className={styles.option}
              onClick={() => {
                setActivePage('previousGames');
              }}
            >
              Previous Games
            </div>
            <div
              className={styles.option}
              onClick={() => {
                setActivePage('tnc');
              }}
            >
              Terms and Conditions
            </div>
            <div className={styles.logoutOption} onClick={handleLogout}>
              Log Out
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className={styles.rightMenu}>{renderContent()}</div>
      <div className={styles.overlay} onClick={onClose} />
    </>
  );
};

export default RightSideMenu;
