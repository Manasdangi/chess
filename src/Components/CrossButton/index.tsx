import React from 'react';
import styles from './CrossButton.module.scss';

interface CrossButtonProps {
  onClick: () => void;
}

const CrossButton: React.FC<CrossButtonProps> = ({ onClick }) => {
  return (
    <button className={styles.crossButton} onClick={onClick}>
      ×
    </button>
  );
};

export default CrossButton;
