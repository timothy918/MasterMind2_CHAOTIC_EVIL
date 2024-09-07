import {
  getDocs,
  serverTimestamp,
  addDoc,
  query,
  where,
  deleteDoc,
  onSnapshot, // Import onSnapshot for real-time updates
  // getCountFromServer,
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";

import { colRef, checkNSetCookie, getCookie } from "./index.js";

// Get a reference to the "RemoveFake" button
document.getElementById("RemoveFake").addEventListener("click", async () => {
  try {
    // Query the Firestore collection to find all documents with isReal = true
    const querySnapshot = await getDocs(
      query(colRef, where("isReal", "==", false))
    );
    // Loop through the documents and delete them
    querySnapshot.forEach(async (doc) => {
      try {
        await deleteDoc(doc.ref); // Delete each document using its reference
      } catch (deleteError) {
        console.error("Error deleting document:", deleteError);
      }
    });
    // Provide feedback to the user (optional)
    alert("All fake data has been removed from Firestore.");
  } catch (error) {
    console.error("Error removing fake data:", error);
  }
});

document.getElementById("Fabricate").addEventListener("click", function () {
  var n_Games = document.getElementById("n_Games");
  generateFakeData(n_Games.value);
});
function generateFakeData(n_Games) {
  for (let i = 0; i < n_Games; i++) {
    //Create a fake game document
    var gameDoc = {
      ipAddress: "Anonymous",
      gameMode: Math.random() > 0.5 ? 3 : 7,
      isReal: false,
      dateTime: serverTimestamp(),
    };
    let chanceRemaining = 16;
    let n_Slots = 4;
    let n_Choices = 6;
    let l_Uncertainty = 0;
    let levelsArray = [];
    let levelMap = [];
    for (let level = 1; level <= gameDoc.gameMode; level++) {
      // Generate random answer
      const minNumber = Math.pow(n_Choices, n_Slots);
      const maxNumber = 2 * minNumber - 1;
      const randomDecimal =
        Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
      let wrongs = [];
      let rights = [];
      levelMap = {
        level: level,
        n_Choices: n_Choices,
        n_Slots: n_Slots,
        l_Uncertainty: l_Uncertainty,
        answer: randomDecimal.toString(n_Choices).slice(1),
      }; // Create an embedded document object
      for (chanceRemaining; chanceRemaining > 0; chanceRemaining--) {
        let wrong = Math.floor(Math.random() * n_Slots);
        let right = Math.ceil(Math.random() * (n_Slots - wrong));
        wrongs.push(wrong);
        rights.push(right);
        if (right === n_Slots) {
          chanceRemaining--;
          break;
        }
      } //end of turn
      levelMap.rights = rights;
      levelMap.wrongs = wrongs;
      levelMap.time = rights.length * 5000;
      levelsArray.push(levelMap);
      if (chanceRemaining === 0) {
        gameDoc.resultScore = level - gameDoc.gameMode - 1;
        break;
      }
      if (level !== gameDoc.gameMode) {
        chanceRemaining += gameDoc.gameMode;
      }
    } //end of level
    gameDoc.levels = levelsArray;
    if (levelsArray.length === gameDoc.gameMode && !gameDoc.resultScore) {
      gameDoc.resultScore = chanceRemaining;
      let sumElapsedTime =
        levelsArray.reduce((sum, levelMap) => {
          return sum + levelMap.time;
        }, 0) / 1000; // Convert to seconds
      gameDoc.secondsPerLevel = sumElapsedTime / gameDoc.gameMode;
    }
    addDoc(colRef, gameDoc); //Add the fake game document to the collection
  } //end of game
}
let userIP;
const queries = getQueries(); // Define an array of queries
const realTimeCounts = new Array(queries.length).fill(0); // Define an array to store real-time counts
attachQueryListeners(queries, realTimeCounts); // Loop through the queries and attach onSnapshot listeners
// Function to define and return queries
function getQueries() {
  const baseQueries = [
    query(colRef, where("gameMode", "==", 3)), // GameMode 3
    query(colRef, where("gameMode", "==", 7)), // GameMode 7
    query(
      query(colRef, where("gameMode", "==", 3)),
      where("isReal", "==", true)
    ), // Real GameMode 3
    query(
      query(colRef, where("gameMode", "==", 7)),
      where("isReal", "==", true)
    ), // Real GameMode 7
  ];
  try {
    // Try to get the player's IP address and create personalized queries
    userIP = getCookie("MasterMind2playerID");
    const personalizedQueries = [
      query(baseQueries[2], where("ipAddress", "==", userIP)), // Personal Real GameMode 3
      query(baseQueries[3], where("ipAddress", "==", userIP)), // Personal Real GameMode 7
    ];
    return [...baseQueries, ...personalizedQueries]; // Return both base and personalized queries
  } catch (error) {
    console.log("User's IP address not found");
    return baseQueries; // Return only base queries if no user IP
  }
}
// Function to attach onSnapshot listeners
function attachQueryListeners(queries, realTimeCounts) {
  queries.forEach((query, index) => {
    const unsubscribe = onSnapshot(query, (snapshot) => {
      realTimeCounts[index] = snapshot.size;
      updateCountDisplay(realTimeCounts);
    });
    // You can store the unsubscribe function if you need it later
  });
}
// Function to update the table display
function updateCountDisplay(realTimeCounts) {
  const table = document.getElementById("population");
  const gameMode3Row = table.rows[2]; // Row for GameMode 3
  gameMode3Row.cells[3].textContent = realTimeCounts[0] - realTimeCounts[2]; // Fake = all - real count
  gameMode3Row.cells[4].textContent = realTimeCounts[0]; // Total count
  const gameMode7Row = table.rows[3]; // Row for GameMode 7
  gameMode7Row.cells[3].textContent = realTimeCounts[1] - realTimeCounts[3]; // Fake = all - real count
  gameMode7Row.cells[4].textContent = realTimeCounts[1]; // Total count
  if (userIP) {
    gameMode3Row.cells[1].textContent = realTimeCounts[4]; // "yours" real count
    gameMode3Row.cells[2].textContent = realTimeCounts[2] - realTimeCounts[4]; // others = real- yours count
    gameMode7Row.cells[1].textContent = realTimeCounts[5]; // "yours" real count
    gameMode7Row.cells[2].textContent = realTimeCounts[3] - realTimeCounts[5]; // others = real- yours count
  } else {
    gameMode3Row.cells[1].textContent = "NaN"; // "yours" real count
    gameMode3Row.cells[2].textContent = realTimeCounts[2]; // others = real
    gameMode7Row.cells[1].textContent = "NaN"; // "yours" real count
    gameMode7Row.cells[2].textContent = realTimeCounts[3]; // others = real
  }
}
