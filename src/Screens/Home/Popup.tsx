import { useEffect } from 'react';
import styles from './Home.module.scss';

interface PopupProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error';
}

export default function Popup({ message, onClose, type = 'success' }: PopupProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.popup} ${styles[type]}`}>
      <p>{message}</p>
    </div>
  );
}
