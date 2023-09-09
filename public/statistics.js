import {
  getDocs,
  serverTimestamp,
  addDoc,
  query,
  where,
  deleteDoc,
  onSnapshot, // Import onSnapshot for real-time updates
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { colRef } from "./index.js";

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

const countDisplayElement = document.getElementById("DonutChart");
// Define queries to filter documents for gameMode 3 and gameMode 7
const gameMode3Query = query(colRef, where("gameMode", "==", 3));
const gameMode7Query = query(colRef, where("gameMode", "==", 7));
// const lose3Query = query(gameMode3Query, where("resultScore", "<", 0));
// const lose7Query = query(gameMode7Query, where("resultScore", "<", 0));
// Define queries to filter documents where isReal is true
const real3Query = query(gameMode3Query, where("isReal", "==", true));
const real7Query = query(gameMode7Query, where("isReal", "==", true));
// const realLose3Query = query(real3Query, where("resultScore", "<", 0));
// const realLose7Query = query(real7Query, where("resultScore", "<", 0));
// Create an array of query promises
const queryPromises = [
  getDocs(gameMode3Query),
  getDocs(gameMode7Query),
  getDocs(real3Query),
  getDocs(real7Query),
  //   getDocs(lose3Query),
  //   getDocs(lose7Query),
  //   getDocs(realLose3Query),
  //   getDocs(realLose7Query),
];

// Execute all queries in parallel and wait for all promises to resolve
Promise.all(queryPromises)
  .then((querySnapshots) => {
    // Get the count for each query snapshot
    const count3 = querySnapshots[0].size;
    const count7 = querySnapshots[1].size;
    const countReal3 = querySnapshots[2].size;
    const countReal7 = querySnapshots[3].size;
    // const countLose3 = querySnapshots[4].size;
    // const countLose7 = querySnapshots[5].size;
    // const countRealLose3 = querySnapshots[6].size;
    // const countRealLose7 = querySnapshots[7].size;
    // const countWin3 = count3 - countLose3;
    // const countWin7 = count7 - countLose7;
    // const countRealWin3 = countReal3 - countRealLose3;
    // const countRealWin7 = countReal7 - countRealLose7;
    // Update the HTML element with the counts
    countDisplayElement.innerHTML = `gameMode3 real: ${countReal3}, gameMode3 total: ${count3},</br> gameMode7 real: ${countReal7}, gameMode7 total: ${count7}`;
  })
  .catch((error) => {
    console.error("Error fetching counts:", error);
  });
