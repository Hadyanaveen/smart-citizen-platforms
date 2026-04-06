import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDBYO17rQYXZQXfor8QM7RKEFezeCWJBAs",
  authDomain: "smart-citizen-platform-fc654.firebaseapp.com",
  projectId: "smart-citizen-platform-fc654",
  storageBucket: "smart-citizen-platform-fc654.firebasestorage.app",
  messagingSenderId: "925590772525",
  appId: "1:925590772525:web:a2351753844150ff8951a4",
  measurementId: "G-0BH12TTYDJ"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);