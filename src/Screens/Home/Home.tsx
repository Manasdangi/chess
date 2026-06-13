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

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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

  const handleJoin = () => {
    const nextRoomId = getRoomIdFromInput(roomId);
    if (!nextRoomId) {
      showMessage('Please enter a room ID', 'error');
      return;
    }

    socket.emit('checkRoom', nextRoomId, (exists: boolean) => {
      if (exists) {
        console.log('joining room', nextRoomId);
        showMessage('Joining room...');
        navigate(`/room/${nextRoomId}`);
      } else {
        showMessage('Room does not exist', 'error');
      }
    });
  };

  const handleCreate = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    socket.emit('checkRoom', newRoomId, (exists: boolean) => {
      if (exists) {
        console.log('room already used, trying again');
        handleCreate();
      } else {
        setRoomId(newRoomId);
        console.log('creatingRoom', newRoomId);
        navigate(`/room/${newRoomId}`);
      }
    });
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
              <button type="button" className={styles.joinButton} onClick={handleJoin}>
                Join Game
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.divider} role="separator">
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          <button type="button" className={styles.createButton} onClick={handleCreate}>
            Create New Game
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
