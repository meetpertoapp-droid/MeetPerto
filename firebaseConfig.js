import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAlgnTFVTjbe96J9x13KPROMKWTaCapFFw",
  authDomain: "meetperto-app-2aad2.firebaseapp.com",
  projectId: "meetperto-app-2aad2",
  storageBucket: "meetperto-app-2aad2.firebasestorage.app",
  messagingSenderId: "99473420964",
  appId: "1:99473420964:web:80a465eb92a0c6a8f6ec31"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
