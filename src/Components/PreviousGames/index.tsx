import React from 'react';
import CrossButton from '../CrossButton';
import styles from './PreviousGames.module.scss'; // We'll write styles after this

const dummyGames = [
  {
    id: '1',
    date: new Date('2025-04-20'),
    opponent: 'Rohan Sharma',
    result: 'win',
    color: 'white',
  },
  {
    id: '2',
    date: new Date('2025-04-21'),
    opponent: 'Ankit Gupta',
    result: 'loss',
    color: 'black',
  },
  {
    id: '3',
    date: new Date('2025-04-22'),
    opponent: 'Vikram Verma',
    result: 'win',
    color: 'black',
  },
];

interface IProps {
  onClose: () => void;
}

export const PreviousGames: React.FC<IProps> = ({ onClose }) => {
  return (
    <div className={styles.previousGames}>
      <CrossButton onClick={onClose} />
      <h2>Previous Games</h2>
      <div className={styles.gamesList}>
        {dummyGames.map(game => (
          <div key={game.id} className={styles.gameItem}>
            <div>{game.date.toDateString()}</div>
            <div>Opponent: {game.opponent}</div>
            <div>
              Result:
              <span className={game.result === 'win' ? styles.win : styles.loss}>
                {game.result.toUpperCase()}
              </span>
            </div>
            <div>Played as: {game.color.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
