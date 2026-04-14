// Components/Timer.tsx
import styles from '../ChessBoard.module.scss';
import { formatTime } from '../../../utils/Util';

interface TimerProps {
  chosenPieceColor: 'white' | 'black';
  blackTime: number;
  whiteTime: number;
  position: 'top' | 'bottom'; // NEW PROP
}

const Timer: React.FC<TimerProps> = ({
  chosenPieceColor,
  blackTime,
  whiteTime,
  position,
}) => {
  // Decide which timer to show based on chosen color and position
  const isUserTimer =
    (chosenPieceColor === 'white' && position === 'bottom') ||
    (chosenPieceColor === 'black' && position === 'bottom');

  const player = isUserTimer ? chosenPieceColor : chosenPieceColor === 'white' ? 'black' : 'white';
  const time = player === 'black' ? blackTime : whiteTime;

  return (
    <div className={styles.timerLabel}>
      <strong>{player.charAt(0).toUpperCase() + player.slice(1)}:</strong> {formatTime(time)}
    </div>
  );
};

export default Timer;
