import React from 'react';
import styles from './CrossButton.module.scss';

interface CrossButtonProps {
  onClick: () => void;
  className?: string;
}

const CrossButton: React.FC<CrossButtonProps> = ({ onClick, className }) => {
  return (
    <button
      type="button"
      className={[styles.crossButton, className].filter(Boolean).join(' ')}
      onClick={onClick}
      aria-label="Close"
    >
      ×
    </button>
  );
};

export default CrossButton;
