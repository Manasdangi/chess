import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../../Firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import useAuthStore from '../../Context/useAuthStore';
import { fetchGameHistory, type GameHistoryEntry } from '../../services/gameHistory';
import { FcGoogle } from 'react-icons/fc';
import loginHero from '../../assets/Gemini_Generated_Image_gohi2qgohi2qgohi.png';
import styles from './Login.module.scss';

const Login: React.FC = () => {
  // Accessing Zustand store methods
  const setUser = useAuthStore(state => state.setUser);
  const setLoggedIn = useAuthStore(state => state.setLoggedIn);

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google login...');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Sign-in result:', result);
      if (result.user) {
        const user = result.user;
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date(),
          },
          { merge: true }
        );

        let userHistory: GameHistoryEntry[] = [];
        try {
          userHistory = await fetchGameHistory(user.uid);
        } catch (err) {
          console.warn('Could not load game history from Firestore', err);
        }

        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          userHistory,
        });
        setLoggedIn(true);
        alert(`Welcome ${user.displayName}!`);
      }
    } catch (error) {
      console.error('Popup Sign-In error:', error);
      alert('Login failed');
    }
  };

  return (
    <div className={styles.container} style={{ backgroundImage: `url(${loginHero})` }}>
      <div className={styles.panel}>
        <h2 className={styles.title}>Lets Play Chess!</h2>
        <button type="button" className={styles.googleButton} onClick={handleGoogleLogin}>
          <span className={styles.googleIcon} aria-hidden={true}>
            <FcGoogle size={22} />
          </span>
          <span className={styles.googleLabel}>Sign in with Googleee</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
