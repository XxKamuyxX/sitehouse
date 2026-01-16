// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBShaJ4HWoy9jhX9jyPUKdCK0XLZbvtIuE",
  authDomain: "housemanutencao.firebaseapp.com",
  projectId: "housemanutencao",
  storageBucket: "housemanutencao.firebasestorage.app",
  messagingSenderId: "1067713174678",
  appId: "1:1067713174678:web:b1d30e858fe50a7ba236b7",
  measurementId: "G-ZFW2X65B1N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export config for secondary app instances (e.g., Team Management)
// Note: firebaseConfig is already exported above, so we just re-export it here for clarity
// This prevents the duplicate export error

export default app;


