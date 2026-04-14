import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../../Firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import useAuthStore from '../../Context/useAuthStore';
import { fetchGameHistory, type GameHistoryEntry } from '../../services/gameHistory';
import { FcGoogle } from 'react-icons/fc';
import loginHero from '../../assets/Gemini_Generated_Image_gohi2qgohi2qgohi.png';
import styles from './Login.module.scss';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useAuthStore(state => state.setUser);
  const setLoggedIn = useAuthStore(state => state.setLoggedIn);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const user = result.user;
        // Never await setDoc here: if the Firestore request hangs (blocked network, proxy,
        // extensions), awaiting would stall forever and you would never see a success log or
        // reach setUser. Run the write in the background and continue sign-in immediately.
        const hangWatch = window.setTimeout(() => {
          console.warn(
            '[Firestore] Profile write still pending after 12s — check network, ad blockers, and that Firestore is enabled for this Firebase project.'
          );
        }, 12_000);

        void setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: new Date(),
          },
          { merge: true }
        )
          .then(() => {
            window.clearTimeout(hangWatch);
          })
          .catch((firestoreErr: unknown) => {
            window.clearTimeout(hangWatch);
            console.warn(
              'Could not save user profile to Firestore (sign-in still succeeds)',
              firestoreErr
            );
          });

        let userHistory: GameHistoryEntry[] = [];
        try {
          const historyMs = 12_000;
          userHistory = await Promise.race([
            fetchGameHistory(user.uid),
            new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error(`fetchGameHistory timed out after ${historyMs}ms`)),
                historyMs
              )
            ),
          ]);
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
      console.error('Google sign-in failed:', error);
      alert('Login failed. Check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ backgroundImage: `url(${loginHero})` }}>
      {isLoading && (
        <div
          className={styles.loadingOverlay}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Signing in, please wait"
        >
          <div className={styles.loadingInner}>
            <div className={styles.spinner} />
            <p className={styles.loadingMessage}>Signing you in…</p>
          </div>
        </div>
      )}
      <div className={styles.panel}>
        <h2 className={styles.title}>Lets Play Chess!</h2>
        <button
          type="button"
          className={styles.googleButton}
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <span className={styles.googleIcon} aria-hidden={true}>
            <FcGoogle size={22} />
          </span>
          <span className={styles.googleLabel}>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
