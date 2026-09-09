import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPtZtsZATQPaEEOWrhTfdkSIxw87dGOUs",
  authDomain: "landbyselldataentryproject.firebaseapp.com",
  projectId: "landbyselldataentryproject",
  storageBucket: "landbyselldataentryproject.firebasestorage.app",
  messagingSenderId: "492311944600",
  appId: "1:492311944600:web:10bc4dcdbe6f9cd5b09fed",
  measurementId: "G-40H5VDWPP1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Safe initialization for Analytics (in case it runs in Node/Electron background context where window might not exist)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
