import {
  getDocs,
  serverTimestamp,
  addDoc,
  query,
  where,
  deleteDoc,
  onSnapshot, // Import onSnapshot for real-time updates
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { colRef, userIP, checkNSetCookie } from "./index.js";

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

document.getElementById("Generate").addEventListener("click", function () {
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
        console.log(gameDoc.gameMode, level, chanceRemaining);
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

const populationTable = document.getElementById("population");
// Define queries to filter documents for gameMode 3 and gameMode 7
const gameMode3Query = query(colRef, where("gameMode", "==", 3));
const gameMode7Query = query(colRef, where("gameMode", "==", 7));
// Define queries to filter documents where isReal is true
const fake3Query = query(gameMode3Query, where("isReal", "==", false));
const fake7Query = query(gameMode7Query, where("isReal", "==", false));
const queries = [gameMode3Query, gameMode7Query, fake3Query, fake7Query]; // Create an array of queries

try {
  const selfReal3Query = query(
    gameMode3Query,
    where("isReal", "==", true),
    where("ipAddress", "==", userIP)
  );
  const selfReal7Query = query(
    gameMode7Query,
    where("isReal", "==", true),
    where("ipAddress", "==", userIP)
  );
  queries += [selfReal3Query, selfReal7Query];
} catch (error) {
  console.log("User's IP address not found"); // Handle the error gracefully
}
const realTimeCounts = Array(queries.length).fill(0); // Define an object to store the real-time counts
const unsubscribeFunctions = []; // Create an array to store the unsubscribe functions

// Loop through the queries and attach onSnapshot listeners
queries.forEach((query, index) => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    realTimeCounts[index] = snapshot.size;
    updateCountDisplay(realTimeCounts);
  });
  unsubscribeFunctions.push(unsubscribe);
});

// Helper function to update the count display
function updateCountDisplay(realTimeCounts) {
  let populationRows = [
    [
      `3`,
      realTimeCounts[0] - realTimeCounts[2],
      realTimeCounts[2],
      realTimeCounts[0],
    ],
    [
      `7`,
      realTimeCounts[1] - realTimeCounts[3],
      realTimeCounts[3],
      realTimeCounts[1],
    ],
  ];
  populationRows.forEach((rowContent) => {
    const newRow = document.createElement("tr");
    rowContent.forEach((cellContent) => {
      const cell = document.createElement("td");
      cell.innerHTML = cellContent;
      newRow.appendChild(cell);
    });
    populationTable.appendChild(newRow);
  });
  // populationTable.innerHTML = `gameMode3 fake: ${}, gameMode3 total: ${},</br> gameMode7 fake: ${}, gameMode7 total: ${}`;
}
