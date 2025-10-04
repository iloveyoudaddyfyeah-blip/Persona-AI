
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-8369764810-7b30f",
  "appId": "1:561737266475:web:57836c9471a518e194c16e",
  "apiKey": "AIzaSyDCkDzEBKme2E7Jp9y09I3hyq1-QU8zSk8",
  "authDomain": "studio-8369764810-7b30f.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "561737266475"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
