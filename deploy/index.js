import { initializeApp } from "firebase/app";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC4AgRcsyK1_F8MP9tlIME1AJzsc6XPjc",
  authDomain: "mastermind2-chaotic-evil.firebaseapp.com",
  projectId: "mastermind2-chaotic-evil",
  storageBucket: "mastermind2-chaotic-evil.appspot.com",
  messagingSenderId: "1064580915176",
  appId: "1:1064580915176:web:e029954f5a3b2efaf18e5d",
  measurementId: "G-SR3RJ42PJE",
};

// init firebase
initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
