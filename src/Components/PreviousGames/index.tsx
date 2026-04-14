import React, { useEffect, useState } from 'react';
import CrossButton from '../CrossButton';
import styles from './PreviousGames.module.scss';
import useAuthStore from '../../Context/useAuthStore';
import { fetchGameHistory } from '../../services/gameHistory';

interface IProps {
  onClose: () => void;
}

function formatEndReason(reason: string): string {
  const labels: Record<string, string> = {
    king_capture: 'King capture',
    opponent_resigned: 'Opponent resigned',
    opponent_timeout: 'Opponent timed out',
    clock_timeout: 'Clock',
    resigned: 'You resigned',
  };
  return labels[reason] ?? reason.replace(/_/g, ' ');
}

export const PreviousGames: React.FC<IProps> = ({ onClose }) => {
  const user = useAuthStore(state => state.user);
  const setGameHistory = useAuthStore(state => state.setGameHistory);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoadError(null);
    fetchGameHistory(user.uid)
      .then(setGameHistory)
      .catch(err => {
        console.error(err);
        setLoadError('Could not refresh history. Showing cached games.');
      });
  }, [user?.uid, setGameHistory]);

  const games = user?.userHistory ?? [];

  return (
    <div className={styles.previousGames}>
      <CrossButton onClick={onClose} />
      <h2>Previous Games</h2>
      {loadError && <p className={styles.hint}>{loadError}</p>}
      <div className={styles.gamesList}>
        {games.length === 0 ? (
          <p className={styles.empty}>No completed games yet.</p>
        ) : (
          games.map(game => {
            const playedDate = new Date(game.playedAt);
            const opponentLabel =
              game.opponentDisplayName?.trim() || game.opponentEmail || 'Unknown opponent';
            return (
              <div key={game.id ?? `${game.playedAt}-${game.opponentEmail}`} className={styles.gameItem}>
                <div>{playedDate.toDateString()}</div>
                <div>Opponent: {opponentLabel}</div>
                {game.opponentDisplayName?.trim() && (
                  <div className={styles.emailLine}>{game.opponentEmail}</div>
                )}
                <div>
                  Result:
                  <span className={game.result === 'win' ? styles.win : styles.loss}>
                    {game.result.toUpperCase()}
                  </span>
                </div>
                {game.endReason && (
                  <div className={styles.endReason}>End: {formatEndReason(game.endReason)}</div>
                )}
                <div>Played as: {game.myColor.toUpperCase()}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
