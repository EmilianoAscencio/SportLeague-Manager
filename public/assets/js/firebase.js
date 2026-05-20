import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyASWiebi9crdBNWXyw9qE1xOYtNs0zE6rM",
  authDomain: "sportleague-manager.firebaseapp.com",
  projectId: "sportleague-manager",
  storageBucket: "sportleague-manager.firebasestorage.app",
  messagingSenderId: "317830648757",
  appId: "1:317830648757:web:548478bebf7f9ec2babffc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
