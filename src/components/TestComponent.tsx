import React from 'react';
import styles from './TestComponent.module.scss';

interface TestComponentProps {
  message: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ message }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{message}</h1>
    </div>
  );
};

export default TestComponent; 