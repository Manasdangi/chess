import React from 'react';
import styles from './RightMenu.module.scss';
import { ProfileDetails } from '../ProfileDetails';
import TnC from '../TnC';
import { PreviousGames } from '../PreviousGames';
import useAuthStore from '../../Context/useAuthStore';
import {
  IoClose,
  IoPersonOutline,
  IoGameControllerOutline,
  IoDocumentTextOutline,
  IoLogOutOutline,
} from 'react-icons/io5';

interface RightSideMenuProps {
  onClose: () => void;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return '?';
}

const RightSideMenu: React.FC<RightSideMenuProps> = ({ onClose }) => {
  const [activePage, setActivePage] = React.useState<'profile' | 'previousGames' | 'tnc' | null>(null);
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const displayName = user?.displayName?.trim() || 'Player';
  const photoURL = user?.photoURL;

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
        return (
          <TnC
            onClose={() => {
              setActivePage(null);
            }}
          />
        );
      default:
        return (
          <div className={styles.accountSection}>
            <div className={styles.profileBlock}>
              <div className={styles.avatarRing}>
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt=""
                    className={styles.profileImage}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={styles.avatarFallback} aria-hidden>
                    {initialsFromName(displayName)}
                  </span>
                )}
              </div>
              <p className={styles.userName}>{displayName}</p>
              {user?.email && <p className={styles.userEmail}>{user.email}</p>}
            </div>

            <nav className={styles.nav} aria-label="Account">
              <button
                type="button"
                className={styles.navButton}
                onClick={() => setActivePage('profile')}
              >
                <IoPersonOutline className={styles.navIcon} aria-hidden />
                Profile Details
              </button>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => setActivePage('previousGames')}
              >
                <IoGameControllerOutline className={styles.navIcon} aria-hidden />
                Previous Games
              </button>
              <button
                type="button"
                className={styles.navButton}
                onClick={() => setActivePage('tnc')}
              >
                <IoDocumentTextOutline className={styles.navIcon} aria-hidden />
                Terms and Conditions
              </button>
            </nav>

            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              <IoLogOutOutline className={styles.navIcon} aria-hidden />
              Log Out
            </button>
          </div>
        );
    }
  };

  const showMainChrome = activePage === null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden />
      <div className={styles.rightMenu} role="dialog" aria-modal="true" aria-label="Account menu">
        {showMainChrome && (
          <div className={styles.drawerHeader}>
            <h2 className={styles.drawerTitle}>Account</h2>
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
              <IoClose size={22} />
            </button>
          </div>
        )}
        <div className={showMainChrome ? styles.drawerBody : styles.drawerBodyFull}>{renderContent()}</div>
      </div>
    </>
  );
};

export default RightSideMenu;
