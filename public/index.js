import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
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
let cookieAccepted = false;

export {
  db,
  colRef,
  userIP,
  checkNSetCookie,
  getCookie,
  cookieAccepted,
  timeframes,
};

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      const d = c.substring(nameEQ.length, c.length);
      userIP = d;
      return d; // Return the cookie value
    }
  }
  return null; // Return null if not found
}

async function checkNSetCookie() {
  userIP = getCookie("MasterMind2userIP");
  const expiryDate = new Date(); // Set the expiration date to 400 days from now
  expiryDate.setDate(expiryDate.getDate() + 400); // Add 400 days
  const maxLength = 20; // Set a maximum length for the player ID
  if (!userIP) {
    let customUserIP = prompt(
      `Enter your desired player ID (max ${maxLength} characters) to track personal result. 
      Cancel to decline cookies.`
    );
    if (customUserIP === null) {
      userIP = "Anonymous"; // Check if the user clicked "Cancel"
      return; // Exit the function early if the user cancels
    }
    // Handle empty or invalid player ID
    while (customUserIP) {
      let q = query(colRef, where("ipAddress", "==", customUserIP));
      const querySnapshot = await getDocs(q); // Execute the query
      if (querySnapshot.empty && customUserIP.length <= maxLength) {
        document.cookie = `MasterMind2userIP=${customUserIP}; expires=${expiryDate.toUTCString()}; path=/`;
        console.log("Player ID set:", customUserIP, "expiring at", expiryDate); // Set the cookie with the custom player ID
        userIP = customUserIP;
        cookieAccepted = true;
        break; // Exit the loop if the ID is successfully set
      } else {
        customUserIP = prompt(
          "Either too long or taken. Try a different player ID."
        );
        if (customUserIP === null) {
          userIP = "Anonymous"; // If the user clicks "Cancel" in this prompt, break the loop
          return; // Exit the function early if the user cancels again
        }
      }
    }
  } else {
    cookieAccepted = true; // If the cookie already exists, update its expiration date
    document.cookie = `MasterMind2userIP=${userIP}; expires=${expiryDate.toUTCString()}; path=/`;
    console.log("Player ID:", userIP, "updated to expire at", expiryDate);
  }
}
// Define timeframes in seconds
const timeframes = [
  { label: "all time", duration: Infinity },
  { label: "yearly", duration: 31557600 }, // 1 year (365.25 days)
  { label: "quarterly", duration: 7889400 }, // 3 months (approx.)
  { label: "monthly", duration: 2629800 }, // 1 month (approx.)
  { label: "weekly", duration: 604800 }, // 7 days
  { label: "daily", duration: 86400 }, // 24 hours
  { label: "hourly", duration: 3600 }, // 24 hours
];
