import React from 'react';
import styles from './TnC.module.scss';
import CrossButton from '../CrossButton';

interface IProps {
  onClose: () => void;
}
const TnC: React.FC<IProps> = ({ onClose }) => {
  return (
    <div className={styles.tncPage}>
      <CrossButton onClick={onClose} />
      <h2>Terms & Conditions</h2>
      <div className={styles.content}>
        <p>
          Welcome to ChessGame! By using our services, you agree to follow these terms and
          conditions carefully.
        </p>
        <ul>
          <li>You must be at least 13 years old to use this platform.</li>
          <li>No cheating or unfair means are allowed during gameplay.</li>
          <li>Respect other players at all times.</li>
          <li>Any violation may result in suspension of your account.</li>
          <li>We reserve the right to update these terms at any time.</li>
        </ul>
        <p>Thank you for being a part of our community!</p>
      </div>
    </div>
  );
};

export default TnC;
