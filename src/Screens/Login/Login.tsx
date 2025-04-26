import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../../Firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import useAuthStore from '../../Context/useAuthStore';
import styles from './Login.module.scss';

const Login: React.FC = () => {
  // Accessing Zustand store methods
  const setUser = useAuthStore(state => state.setUser);
  const setLoggedIn = useAuthStore(state => state.setLoggedIn);
  const addToHistory = useAuthStore(state => state.addToHistory);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        const user = result.user;
        console.log('User signed in:', user);

        // Store user information in Firestore
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

        // Update Zustand store with the authenticated user
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        setLoggedIn(true);

        // Add a history entry for the login action
        addToHistory({
          action: 'Logged In',
          time: new Date(),
        });

        alert(`Welcome ${user.displayName}!`);
      }
    } catch (error) {
      console.error('Popup Sign-In error:', error);
      alert('Login failed');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Sign In</h2>
      <button className={styles.googleButton} onClick={handleGoogleLogin}>
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
