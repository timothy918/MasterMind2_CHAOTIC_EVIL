import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  addDoc,
  query,
  where,
  deleteDoc,
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

// init firebase
initializeApp(firebaseConfig);

// Initialize Firebase
const db = getFirestore();
const colRef = collection(db, "GamesPlayed");
export { colRef };

// Get a reference to the "RemoveFake" button
document.getElementById("RemoveFake").addEventListener("click", async () => {
  try {
    // Query the Firestore collection to find all documents with isFake = true
    const querySnapshot = await getDocs(
      query(colRef, where("isFake", "==", true))
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
      ipAddress: Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256)
      ).join("."), // Generate four random parts
      gameMode: Math.random() > 0.5 ? 3 : 7,
      isFake: true,
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
