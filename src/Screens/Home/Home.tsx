import { useState } from 'react';
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
          <button
            type="button"
            className={styles.signInButton}
            onClick={() => setShowLogin(true)}
          >
            Sign in
          </button>
        )}

        <main className={styles.card}>
          <header className={styles.cardHeader}>
            <span className={styles.brandMark} aria-hidden>
              <FaChessKnight />
            </span>
            <p className={styles.greeting}>Welcome, {displayName}</p>
            <h1 className={styles.title}>Play Chess Online</h1>
            <p className={styles.subtitle}>
              Join a friend&apos;s room or start a new board in one click.
            </p>
          </header>

          <div className={styles.joinBlock}>
            <label htmlFor="room-id" className={styles.visuallyHidden}>
              Room ID
            </label>
            <div className={styles.inputGroup}>
              <input
                id="room-id"
                className={styles.roomInput}
                placeholder="Enter room ID or invite link"
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
              <button
                type="button"
                className={styles.joinButton}
                onClick={handleJoin}
                disabled={isJoiningRoom}
              >
                {isJoiningRoom ? 'Joining...' : 'Join Game'}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.divider} role="separator">
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          <button
            type="button"
            className={styles.createButton}
            onClick={handleCreate}
            disabled={isCreatingRoom}
          >
            {isCreatingRoom ? 'Creating...' : 'Create New Game'}
          </button>
        </main>

        {showPopup && (
          <Popup message={popupMessage} onClose={() => setShowPopup(false)} type={popupType} />
        )}
      </div>
      {showMenu && <RightSideMenu onClose={() => setShowMenu(false)} />}
    </>
  );
}
