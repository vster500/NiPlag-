
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQgWF1-XtGd8M1-rEc7XrUCHK0hnQLu74",
  authDomain: "niplag-637d1.firebaseapp.com",
  projectId: "niplag-637d1",
  storageBucket: "niplag-637d1.firebasestorage.app",
  messagingSenderId: "64469731918",
  appId: "1:64469731918:web:e49fa1f59ec939f1ab511f"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

