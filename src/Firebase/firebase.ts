// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAw2zHO1O4aWrdX6F62dyanVIWl205Nl-k',
  authDomain: 'chessgame-1c9c2.firebaseapp.com',
  projectId: 'chessgame-1c9c2',
  storageBucket: 'chessgame-1c9c2.firebasestorage.app',
  messagingSenderId: '734152785784',
  appId: '1:734152785784:web:b201c5ca4e15b4c926128d',
  measurementId: 'G-6QSVGTYQ6E',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth + Google Provider
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// ✅ Firestore
export const db = getFirestore(app);
