import React from 'react';
import useAuthStore from '../../Context/useAuthStore';
import styles from './ProfileDetails.module.scss'; // We'll write styles after this
import CrossButton from '../CrossButton';

interface IProps {
  onClose: () => void;
}
export const ProfileDetails: React.FC<IProps> = ({ onClose }) => {
  const user = useAuthStore(state => state.user);

  if (!user) {
    return <div className={styles.noUser}>No user information available.</div>;
  }

  return (
    <div className={styles.profileDetails}>
      <CrossButton onClick={onClose} />

      <div className={styles.profileImageWrapper}>
        <img
          src={user.photoURL || 'https://i.pravatar.cc/150'}
          alt="Profile"
          className={styles.profileImage}
        />
      </div>
      <div className={styles.info}>
        <h2 className={styles.name}>{user.displayName || 'Anonymous User'}</h2>
        <p className={styles.email}>{user.email}</p>
        <p className={styles.uid}>
          <strong>UID:</strong> {user.uid}
        </p>
      </div>
    </div>
  );
};
