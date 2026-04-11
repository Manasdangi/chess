// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAUMONRkuuYpSrKl7i3BqXhbEvv2FolmB8',
  authDomain: 'chess-80fe5.firebaseapp.com',
  projectId: 'chess-80fe5',
  storageBucket: 'chess-80fe5.firebasestorage.app',
  messagingSenderId: '665661957924',
  appId: '1:665661957924:web:cbdd3ec53d2fdd430fb5b1',
  measurementId: 'G-05B66TMHVG',
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth + Google Provider
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// ✅ Firestore
export const db = getFirestore(app);
