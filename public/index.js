import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC4AgRcsyK1_F8MP9tlIME1AJzsc6XPjc",
  authDomain: "mastermind2-chaotic-evil.firebaseapp.com",
  projectId: "mastermind2-chaotic-evil",
  storageBucket: "mastermind2-chaotic-evil.appspot.com",
  messagingSenderId: "1064580915176",
  appId: "1:1064580915176:web:e029954f5a3b2efaf18e5d",
  measurementId: "G-SR3RJ42PJE",
};

initializeApp(firebaseConfig); // init firebase
const db = getFirestore(); // Initialize Firebase
const colRef = collection(db, "GamesPlayed");
export { colRef };

let userIP;
// Make an HTTP request to get the user's IP address
fetch("https://ipinfo.io/json")
  .then((response) => {
    if (!response.ok) {
      // Check if the response status is not OK
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    userIP = data.ip; // Save the user's IP to the variable
  })
  .catch((error) => {
    userIP = "Anonymous";
  });
export { userIP };
