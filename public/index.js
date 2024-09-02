import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
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
export { db, colRef, checkBest, checkCookie, userIP };

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

async function checkBest(isPublic = true, userIP = null) {
  const results = [];
  const now = Timestamp.now();
  let lastRecordHold = null;
  // Define timeframes in seconds
  const timeframes = [
    { label: "all time", duration: Infinity },
    { label: "last year", duration: 31557600 }, // 1 year (365.25 days)
    { label: "last quarter", duration: 7889400 }, // 3 months (approx.)
    { label: "last month", duration: 2629800 }, // 1 month (approx.)
    { label: "last 7 days", duration: 604800 }, // 7 days
    { label: "last 24 hours", duration: 86400 }, // 24 hours
  ];

  for (const timeframe of timeframes) {
    // If the record hold is less than the current timeframe duration, skip the loop
    if (lastRecordHold !== null && lastRecordHold <= timeframe.duration) {
      results.push(results[results.length - 1]); // Push the last result since it's the same record
      continue;
    }

    const lastDuration =
      timeframe.duration === Infinity ? 0 : now.seconds - timeframe.duration;
    const lastTimestamp = new Timestamp(lastDuration, 0);

    let q = query(colRef, where("dateTime", ">=", lastTimestamp)); // Create the base query to find documents within the timeframe
    // If checking personal best, add the IP address filter
    if (!isPublic && userIP) {
      // Create the base query to find documents within the timeframe
      q = query(
        q,
        where("ipAddress", "==", userIP) // where("resultScore", ">=", 0),
      );
    }
    getDocs(q).then((snapshot) => {
      const sortedQ = snapshot.docs.map((doc) => doc.data()); // Map through the snapshot docs and extract the data
      sortedQ.sort((a, b) => {
        return b.resultScore - a.resultScore; // Sort the results array manually by the 'resultScore' field
      });
      sortedQ.sort((a, b) => {
        return a.secondsPerLevel - b.secondsPerLevel; // Sort the results array manually by the 'secondsPerLevel' field
      });
      try {
        // Initialize variables for highest score and lowest secondsPerLevel
        let highestScore = null;
        let lowestSecondsPerLevel = null;

        // Check if there are any documents in the results array
        if (sortedQ.length > 0) {
          const data = sortedQ[0]; // Get the first document's data
          highestScore = data.resultScore;
          lowestSecondsPerLevel =
            data.secondsPerLevel !== undefined ? data.secondsPerLevel : null;
          lastRecordHold = now.seconds - data.dateTime.seconds; // Calculate record hold in seconds
        }
        results.push([highestScore, lowestSecondsPerLevel]);
      } catch (error) {
        console.error("Error processing results:", error);
        results.push([null, null]); // If there's an error, push null values
      }
    });
  }
  console.log("Results:", isPublic ? "Public" : `for IP ${userIP}`, results);
  return results; // Return a two-dimensional array with results for each timeframe
}
