import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
let userIP;
export { db, colRef, userIP, checkCookie };

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      let d = c.substring(nameEQ.length, c.length);
      userIP = d;
      return d; // Return the cookie value
    }
  }
  return null; // Return null if not found
}

function checkCookie() {
  const playerID = getCookie("MasterMind2playerID");
  const expiryDate = new Date(); // Set the expiration date to 400 days from now
  expiryDate.setDate(expiryDate.getDate() + 400); // Add 400 days
  if (!playerID) {
    const playerConsent = confirm(
      "If you accept the cookies, you would be able to track your personal best."
    );
    if (playerConsent) {
      // Set a cookie that never expires (or expires far in the future)
      userIP = `${Date.now()}`; // Generate a unique ID using the current timestamp
      console.log("Player ID:", userIP, "expiring at ", expiryDate); // Log the existing player ID
      document.cookie = `MasterMind2playerID=${userIP}; expires=${expiryDate.toUTCString()}; path=/`;
    } else {
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
          console.log(userIP, "w/out cookie");
        })
        .catch((error) => {
          userIP = "Anonymous";
        });
    }
  } else {
    document.cookie = `MasterMind2playerID=${playerID}; expires=${expiryDate.toUTCString()}; path=/`;
    console.log("Player ID:", playerID, "updated to ", expiryDate); // Log the existing player ID
  }
}
