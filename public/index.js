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
export { db, colRef, userIP, checkNSetCookie, getCookie };

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

async function checkNSetCookie() {
  const playerID = getCookie("MasterMind2playerID");
  const expiryDate = new Date(); // Set the expiration date to 400 days from now
  expiryDate.setDate(expiryDate.getDate() + 400); // Add 400 days
  const maxLength = 20; // Set a maximum length for the player ID

  if (!playerID) {
    let customPlayerID = prompt(
      `Enter your desired player ID (max ${maxLength} characters) to track personal result. 
      Cancel to decline cookies.`
    );
    while (customPlayerID) {
      let q = query(colRef, where("ipAddress", "==", customPlayerID));
      const querySnapshot = await getDocs(q); // Execute the query

      if (querySnapshot.empty && customPlayerID.length <= maxLength) {
        // Set the cookie with the custom player ID
        document.cookie = `MasterMind2playerID=${customPlayerID}; expires=${expiryDate.toUTCString()}; path=/`;
        console.log(
          "Player ID set:",
          customPlayerID,
          "expiring at",
          expiryDate
        );
        playerID = customPlayerID;
        break; // Exit the loop if the ID is successfully set
      } else {
        customPlayerID = prompt(
          "Either too long or duplicate. Try a different player ID."
        );
      }
    }
    cookieRejected = true;
    userIP = data.ip; // Save the user's IP to the variable
  } else {
    // If the cookie already exists, update its expiration date
    document.cookie = `MasterMind2playerID=${playerID}; expires=${expiryDate.toUTCString()}; path=/`;
    console.log("Player ID:", playerID, "updated to expire at", expiryDate);
  }
}
