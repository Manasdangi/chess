import React from 'react';
import styles from './RightMenu.module.scss';

interface RightSideMenuProps {
  onClose: () => void;
}

const RightSideMenu: React.FC<RightSideMenuProps> = ({ onClose }) => {
  return (
    <>
      <div className={styles.rightMenu}>
        <div className={styles.accountSection}>
          <div className={styles.profileImageWrapper}>
            <img
              src="https://i.pravatar.cc/150?img=3"
              alt="Profile"
              className={styles.profileImage}
            />
          </div>

          <div className={styles.option}>Profile Details</div>
          <div className={styles.option}>Previous Games</div>
          <div className={styles.option}>Rules</div>
          <div className={styles.logoutOption}>Log Out</div>
        </div>
      </div>

      <div className={styles.overlay} onClick={onClose} />
    </>
  );
};

export default RightSideMenu;
