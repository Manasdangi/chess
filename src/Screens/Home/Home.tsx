import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../../Socket/socket';
import styles from './Home.module.scss';
import Popup from './Popup';
import useAuthStore from '../../Context/useAuthStore';
import Login from '../Login/Login';
import { GiHamburgerMenu } from 'react-icons/gi';
import { FaChessKnight } from 'react-icons/fa6';
import RightSideMenu from '../../Components/RightMenu';
import { getGuestIdentity } from '../../utils/guestIdentity';
import { registerHomeViewer } from '../../services/viewerCount';
import {
  BOT_DIFFICULTIES,
  BOT_DIFFICULTY_LABELS,
  type BotDifficulty,
} from '../../utils/stockfishBot';

function waitForSocketConnection(timeoutMs = 5000): Promise<boolean> {
  if (socket.connected) return Promise.resolve(true);

  socket.connect();
  return new Promise(resolve => {
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleError);
    };
    const handleConnect = () => {
      cleanup();
      resolve(true);
    };
    const handleError = () => {
      cleanup();
      resolve(false);
    };
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);

    socket.once('connect', handleConnect);
    socket.once('connect_error', handleError);
  });
}

function checkRoomExists(roomId: string, timeoutMs = 5000): Promise<boolean | null> {
  return new Promise(resolve => {
    const timeoutId = window.setTimeout(() => resolve(null), timeoutMs);
    socket.emit('checkRoom', roomId, (exists: boolean) => {
      window.clearTimeout(timeoutId);
      resolve(exists);
    });
  });
}

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [viewerCountFailed, setViewerCountFailed] = useState(false);
  const navigate = useNavigate();

  const { isLoggedIn, user } = useAuthStore();
  const guestIdentity = getGuestIdentity();
  const displayName = isLoggedIn
    ? user?.displayName?.trim() || 'Player'
    : guestIdentity.displayName;

  const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const getRoomIdFromInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';

    try {
      const url = new URL(trimmed);
      const roomFromPath = url.pathname.split('/').filter(Boolean).pop();
      return roomFromPath?.trim() ?? '';
    } catch {
      return trimmed;
    }
  };

  const handleJoin = async () => {
    if (isJoiningRoom) return;
    const nextRoomId = getRoomIdFromInput(roomId);
    if (!nextRoomId) {
      showMessage('Please enter a room ID', 'error');
      return;
    }

    setIsJoiningRoom(true);
    const isConnected = await waitForSocketConnection();
    if (!isConnected) {
      setIsJoiningRoom(false);
      showMessage('Game server is not running. Start it with npm run dev:backend.', 'error');
      return;
    }

    const exists = await checkRoomExists(nextRoomId);
    setIsJoiningRoom(false);
    if (exists === null) {
      showMessage('Game server did not respond. Please try again.', 'error');
    } else if (exists) {
      console.log('joining room', nextRoomId);
      showMessage('Joining room...');
      navigate(`/room/${nextRoomId}`);
    } else {
      showMessage('Room does not exist', 'error');
    }
  };

  const handleCreate = async () => {
    if (isCreatingRoom) return;

    setIsCreatingRoom(true);
    const isConnected = await waitForSocketConnection();
    if (!isConnected) {
      setIsCreatingRoom(false);
      showMessage('Game server is not running. Start it with npm run dev:backend.', 'error');
      return;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const newRoomId = Math.random().toString(36).substring(2, 8);
      const exists = await checkRoomExists(newRoomId);
      if (exists === null) {
        setIsCreatingRoom(false);
        showMessage('Game server did not respond. Please try again.', 'error');
        return;
      }
      if (!exists) {
        setRoomId(newRoomId);
        console.log('creatingRoom', newRoomId);
        setIsCreatingRoom(false);
        navigate(`/room/${newRoomId}`);
        return;
      }
      console.log('room already used, trying again');
    }

    setIsCreatingRoom(false);
    showMessage('Could not create a unique room. Please try again.', 'error');
  };

  const handlePlayBot = () => {
    navigate(`/bot?difficulty=${botDifficulty}`);
  };

  useEffect(() => {
    let isMounted = true;

    registerHomeViewer()
      .then(count => {
        if (!isMounted) return;
        setViewerCount(count);
        setViewerCountFailed(false);
      })
      .catch(error => {
        console.warn('Could not update viewer count', error);
        if (isMounted) setViewerCountFailed(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (showLogin && !isLoggedIn) return <Login onContinueAsGuest={() => setShowLogin(false)} />;

  return (
    <>
      <div className={styles.page}>
        {isLoggedIn ? (
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Open menu"
            onClick={() => setShowMenu(true)}
          >
            <GiHamburgerMenu size={22} />
          </button>
        ) : (
          <button type="button" className={styles.signInButton} onClick={() => setShowLogin(true)}>
            Sign in
          </button>
        )}

        <main className={styles.card}>
          <header className={styles.cardHeader}>
            <span className={styles.brandMark} aria-hidden>
              <FaChessKnight />
            </span>
            <p className={styles.greeting}>Welcome, {displayName}</p>
            <h1 className={styles.title}>Choose Game Mode</h1>
            <p className={styles.viewerCount} aria-live="polite">
              {viewerCountFailed
                ? 'Viewer count unavailable'
                : viewerCount === null
                  ? 'Loading total viewers...'
                  : `${viewerCount} all-time ${viewerCount === 1 ? 'viewer' : 'viewers'}`}
            </p>
          </header>

          <div className={styles.modeGrid}>
            <section className={styles.modeCard}>
              <div className={styles.modeHeader}>
                <h2>Play Online</h2>
                <p>Use a room with another player.</p>
              </div>

              <label htmlFor="room-id" className={styles.fieldLabel}>
                Room ID or invite link
              </label>
              <input
                id="room-id"
                className={styles.roomInput}
                placeholder="abc123"
                value={roomId}
                onChange={e => {
                  setRoomId(e.target.value);
                  setError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleJoin();
                }}
                autoComplete="off"
                spellCheck={false}
              />

              <div className={styles.onlineActions}>
                <button
                  type="button"
                  className={styles.joinButton}
                  onClick={handleJoin}
                  disabled={isJoiningRoom}
                >
                  {isJoiningRoom ? 'Joining...' : 'Join Room'}
                </button>
                <button
                  type="button"
                  className={styles.createButton}
                  onClick={handleCreate}
                  disabled={isCreatingRoom}
                >
                  {isCreatingRoom ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </section>

            <section className={`${styles.modeCard} ${styles.botModeCard}`}>
              <div className={styles.modeHeader}>
                <h2>Play Bot</h2>
                <p>Practice against Stockfish.</p>
              </div>

              <label htmlFor="bot-difficulty" className={styles.fieldLabel}>
                Difficulty
              </label>
              <select
                id="bot-difficulty"
                className={styles.botSelect}
                value={botDifficulty}
                onChange={e => setBotDifficulty(e.target.value as BotDifficulty)}
              >
                {BOT_DIFFICULTIES.map(level => (
                  <option key={level} value={level}>
                    {BOT_DIFFICULTY_LABELS[level]}
                  </option>
                ))}
              </select>

              <button type="button" className={styles.botButton} onClick={handlePlayBot}>
                Start Bot Game
              </button>
            </section>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </main>

        {showPopup && (
          <Popup message={popupMessage} onClose={() => setShowPopup(false)} type={popupType} />
        )}
      </div>
      {showMenu && <RightSideMenu onClose={() => setShowMenu(false)} />}
    </>
  );
}
