import {
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import {
  db,
  colRef,
  checkNSetCookie,
  userIP,
  timeframes,
  cookieAccepted,
} from "./index.js";
const outputNumbers = [
  '<span class="white">⓪</span>',
  '<span class="green">①</span>',
  '<span class="yellow">②</span>',
  '<span class="red">③</span>',
  '<span class="blue">④</span>',
  '<span class="black">⑤</span>',
  '<span class="purple">⑥</span>',
  '<span class="lime">⑦</span>',
  '<span class="aqua">⑧</span>',
  '<span class="fuchsia">⑨</span>',
]; // Define your outputNumbers array
const directionButtons = [
  '<button value="188" type="button" class="numberButton white"><</button>',
  '<button value="86" type="button" class="numberButton white">v</button>',
  '<button value="190" type="button" class="numberButton white">></button>',
];
const hints = [
  "Ⓐ",
  "Ⓑ",
  "Ⓒ",
  "Ⓓ",
  "Ⓔ",
  "Ⓕ",
  "Ⓖ",
  "Ⓗ",
  "Ⓘ",
  "Ⓙ",
  "Ⓚ",
  "Ⓛ",
  "Ⓜ",
  "Ⓝ",
  "Ⓞ",
  "Ⓟ",
  "Ⓠ",
  "Ⓢ",
  "Ⓣ",
  "Ⓤ",
  "Ⓥ",
  "Ⓧ",
  "Ⓨ",
  "Ⓩ",
];
const fullName = ["MasterMind II", ": CHAOTIC", "EVIL"];
// Declare the variables
let l_Uncertainty = 0; //for header
let availableHints = [...hints];
let guesses = [];
let startTime, // Variable to store the start time of the level
  n_Slots,
  levelsArray,
  n_Choices,
  currentIndex,
  chanceRemaining,
  level,
  gameMode,
  randomAnswer,
  randomRight,
  randomWrong,
  sumElapsedTime,
  levelMap,
  docRef,
  gameDoc,
  publicBest,
  personalBest,
  ifWinFlag,
  rightHint,
  wrongHint,
  gameEndRows; // Add additional rows
const feedback = [[], []]; // Declare a list to store feedback: [wrongs, rights]
const mainContainer = document.querySelector("main");
const inputContainer = document.getElementById("inputContainer");
const inputButtons = inputContainer.querySelectorAll(".numberButton"); // Get all the button elements within inputContainer
const leftDivision = document.getElementById("left_temp");
const rightDivision = document.getElementById("right_temp");
const header = document.querySelector(".header");
const outputTable = document.getElementById("output");
const questionButton = document.getElementById("question");
const overlay = document.getElementById("overlay");
const enterButton = document.getElementById("enter");
const enterLeft = document.getElementById("enterLeft");
const enterRight = document.getElementById("enterRight");
document.addEventListener("DOMContentLoaded", function () {
  overlayAppear();
  setUpTable();
});
checkNSetCookie();
publicBest = await searchBest(true); // For public best check
if (cookieAccepted) {
  personalBest = await searchBest(false, userIP); // For personal best check
}

function setUpTable() {
  updateHeaderTitle();
  function handleKeybroad(event) {
    const keyCode = event.keyCode || event.which; // Get the pressed key code
    // Check if the game mode is set
    if (keyCode >= 48 && keyCode <= 57) {
      // Number keys 0-9
      const number = keyCode - 48; // Convert key code to number
      for (const button of inputButtons) {
        if (
          button.textContent === String(number) &&
          event.target === document.body
        ) {
          button.click(); // Trigger the click event on the corresponding number button
          break; // Exit the loop once the button is found
        }
      }
    } else {
      switch (keyCode) {
        case 188: // Comma (<),
        case 86: // (v),
        case 190: // or Period (>)
          // Find the direction button with the corresponding value in leftDivision
          const directionButton = leftDivision.querySelector(
            `.numberButton[value="${keyCode}"]`
          );
          if (directionButton && event.target === document.body) {
            directionButton.click(); // Trigger the click event on the direction button
          }
          break;
        case 8: // Check if the pressed key is the Backspace key
          currentIndex = (currentIndex + n_Slots - 1) % n_Slots; // Move currentIndex back by 1, wrapping around if necessary
          const slotMinus1 =
            leftDivision.querySelectorAll(".slot")[currentIndex];
          const buttonMinus1 = slotMinus1.querySelector("button");
          // Remove the button from the targeted slot
          if (buttonMinus1) {
            buttonMinus1.click();
          }
          updateSlotBorders();
          break;
        case 13: // Enter button
          enterButton.click();
          break;
        case 32: // Space bar
          const currentSlot =
            leftDivision.querySelectorAll(".slot")[currentIndex];
          const buttonInSlot = currentSlot.querySelector("button");
          // Trigger the click event on the button in the target slot
          if (buttonInSlot) {
            buttonInSlot.click();
          }
          break;
        case 37: // Left arrow key
          currentIndex = (currentIndex + n_Slots - 1) % n_Slots; // Move currentIndex left by 1, wrapping around if necessary
          updateSlotBorders();
          break;
        case 39: // Right arrow key
          currentIndex = (currentIndex + 1) % n_Slots; // Move currentIndex right by 1, wrapping around if necessary
          updateSlotBorders();
          break;
        case 191: // question mark (?)
          overlayAppear();
          break;
        case 38: // Up arrow key (↑)
          mainContainer.scrollBy({
            top: -50, // Scroll up
            behavior: "smooth", // Smooth scrolling
          });
          break;
        case 40: // Down arrow key (↓)
          mainContainer.scrollBy({
            top: 50, // Scroll down
            behavior: "smooth", // Smooth scrolling
          });
          break;
      }
    }
  }
  document.addEventListener("keydown", handleKeybroad); // Event listener for keydown events
  document.addEventListener("keyup", (event) => {
    if (event.key === "/") {
      overlayDisappear();
    }
  });

  resetGameModeButtons();

  // Event listener for the Enter button
  enterButton.addEventListener("click", function () {
    if (gameMode) {
      const slotsFilled = Array.from(
        leftDivision.querySelectorAll(".slot")
      ).every((slot) => slot.children.length > 0);
      if (slotsFilled) {
        chanceRemaining--;
        const newRow = document.createElement("tr"); // Create a new row in the output table
        const buttonsInSlots = Array.from(
          leftDivision.querySelectorAll(".slot button")
        ); // Get the values of buttons in the slots as the guess
        const guess = buttonsInSlots.map((button) => button.textContent);
        guesses.push(guess.join(""));
        buttonsInSlots.forEach((button) => button.remove()); // Remove buttons from slots and update chanceRemaining
        enterRight.innerHTML = chanceRemaining;
        currentIndex = 0; // Reset the currentIndex and update slot borders
        updateSlotBorders();
        const [wrongs, rights] = turnCount(randomAnswer, guess); // Call the turnCount function with randomAnswer and guess
        feedback.push([wrongs, rights]);
        const firstColumnCell = document.createElement("td"); // Append the guess to the first column
        firstColumnCell.classList.add("large");
        let buttonElement = "";
        buttonsInSlots.forEach((button) => {
          buttonElement += outputNumbers[button.textContent];
          firstColumnCell.innerHTML = buttonElement;
        });
        newRow.appendChild(firstColumnCell);
        if (availableHints.length < 2) {
          availableHints = [...hints];
        } // Check if availableHints is empty, reset it to hints
        if (l_Uncertainty === 2) {
          randomRight = Math.floor(Math.random() * availableHints.length); // Use availableHints instead of hints for randomRight and randomWrong
          do {
            randomWrong = Math.floor(Math.random() * availableHints.length);
          } while (randomWrong === randomRight);
        }
        if (rights === n_Slots) {
          const endTime = performance.now();
          const elapsedTimeInMilliseconds = endTime - startTime;
          levelMap.time = elapsedTimeInMilliseconds;
          const secondColumnCell = document.createElement("td");
          secondColumnCell.innerHTML = `${(
            elapsedTimeInMilliseconds / 1000
          ).toFixed(3)} seconds`;
          newRow.appendChild(secondColumnCell);
          outputTable.appendChild(newRow);
          mainContainer.scrollTop = mainContainer.scrollHeight; //scroll to bottom
          levelWon();
        } else {
          // Append the wrongs and rights values to the second column
          let secondColumnCell = displayFeedback(
            wrongs,
            rights,
            l_Uncertainty,
            randomWrong,
            randomRight
          );
          newRow.appendChild(secondColumnCell);
          outputTable.appendChild(newRow); // Append the new row to the output table
          mainContainer.scrollTop = mainContainer.scrollHeight; //scroll to bottom
          // Check if remaining chances are zero and display "You lose"
          if (chanceRemaining === 0) {
            gameEnd(false);
            return;
          }
        }
      }
    }
  });
  // Attach click event listener to the left division (using event delegation)
  leftDivision.addEventListener("click", function (event) {
    const clickedSlot = event.target.closest(".slot");
    if (clickedSlot) {
      // Get the index of the clicked slot and set it as the current target slot
      const clickedSlotIndex = Array.from(
        leftDivision.querySelectorAll(".slot")
      ).indexOf(clickedSlot);
      currentIndex = clickedSlotIndex;
      const clickedButton = clickedSlot.querySelector("button");
      // Remove the button from the clicked slot
      if (clickedButton) {
        clickedButton.remove();
      }
      updateSlotBorders(); // Update slot borders based on currentIndex
    }
  });
}
function handleRecommendations(event) {
  const target = event.target; // Get the clicked element
  if (target.tagName !== "BUTTON") return; // Ensure the clicked element is a button
  const slotsInLeftTemp = leftDivision.querySelectorAll(".slot"); // Append direction buttons to the first 3 slots in left temp div
  const shareContent = getShareContent(); // Pre-fetch share content (if needed)
  switch (target.textContent) {
    case "<":
      window.open("statistics.html", "_blank"); // Open the link in a new tab when the ">" button is clicked
      slotsInLeftTemp[0].append(target);
      break;
    case "v":
      navigator.clipboard // Copy the content to the clipboard
        .writeText(shareContent)
        .then(() => {
          alert("Share content copied to clipboard!"); // Show an alert message
        })
        .catch((error) => {
          console.error("Failed to copy text: ", error); // Handle the error, if any
          alert("Failed to copy content. Please try again.");
        });
      slotsInLeftTemp[1].append(target);
      break;
    case ">":
      window.open("https://hiretimothykwok.onrender.com/", "_blank"); // Open the link in a new tab when the ">" button is clicked
      slotsInLeftTemp[2].append(target);
      break;
  }
}
// Optimized getShareContent function
function getShareContent() {
  let shareContent = "https://MasterMind2-Chaotic-Evil.web.app/\n";
  const rows = outputTable.rows;
  const lastIndex = rows.length - gameEndRows.length;
  const firstIndex = lastIndex - levelMap.guesses.length;
  let lastLevelRows = Array.from(rows) // Clone the rows for the last level without altering the original table content
    .slice(firstIndex, lastIndex)
    .map((row) => row.cloneNode(true)); // Clone each row to avoid modifying the original table
  const lastRowInLastLevel = lastLevelRows[lastLevelRows.length - 1]; // Access the last row in the cloned rows
  if (ifWinFlag) {
    lastRowInLastLevel.cells[1].textContent = `I cracked ${level} levels using ${
      16 + level * (level - 1) - chanceRemaining
    } chances.`;
  } else {
    lastRowInLastLevel.cells[1].textContent = `I ran out of chance at ${level} level, avenge me!`;
  }
  shareContent += lastLevelRows // Build share content from rows
    .map((row) =>
      Array.from(row.cells)
        .map((cell) => cell.textContent)
        .join(" | ")
    )
    .join("\n");
  // Add end game message if present
  gameEndRows.forEach((row) => {
    if (row[0].content === "Congratulations!") {
      shareContent += `\n${row[1].content}`;
    }
  });
  return shareContent;
}

// Function for Game mode buttons
function selectGameMode(game_Mode) {
  overlayDisappear();
  leftDivision.removeEventListener("click", handleRecommendations);
  inputButtons.forEach((button) => {
    const buttonValue = button.textContent.trim();
    if (buttonValue == "3" || buttonValue == "7") {
      button.removeEventListener("click", handleSelectGameMode);
    }
  });
  level = 1;
  chanceRemaining = 16;
  n_Slots = 4;
  n_Choices = 6;
  l_Uncertainty = 0;
  levelsArray = [];
  gameDoc = {
    ipAddress: userIP,
    gameMode: game_Mode,
    dateTime: serverTimestamp(),
    resultScore: -game_Mode,
  }; // Create an empty JavaScript object to represent the Firestore document
  try {
    addDoc(colRef, gameDoc) // Add the gameDoc to Firebase and get the document reference
      .then((x) => {
        console.log("Game doc (", x.id, ") created");
        docRef = doc(db, "GamesPlayed", x.id);
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
  } catch {
    const firstRow = document.createElement("tr"); // Create a new row in the output table
    const leftCell = document.createElement("td"); // Insert cells in the first column of the output table
    leftCell.textContent = "Sorry,";
    firstRow.appendChild(leftCell);
    const rightCell = document.createElement("td");
    rightCell.textContent = "records writing not available.";
    firstRow.appendChild(rightCell);
    outputTable.appendChild(firstRow); // Append the new row to the output table
    mainContainer.scrollTop = mainContainer.scrollHeight; //scroll to bottom
  }
  enterLeft.innerHTML = `Remaining<br/>chance(s):`; // Update the text content of the enterButton
  enterRight.innerHTML = chanceRemaining;
  Array.from(leftDivision.querySelectorAll(".slot button")).forEach(
    (button) => button.remove() // Remove buttons from slots
  );
  gameMode = game_Mode; // Set the game mode
  const firstRow = document.createElement("tr"); // Create a new row in the output table
  const leftCell = document.createElement("td"); // Insert cells in the first column of the output table
  leftCell.textContent = `Level`;
  firstRow.appendChild(leftCell);
  const rightCell = document.createElement("td");
  rightCell.textContent = `${level - 1} => ${level}`;
  firstRow.appendChild(rightCell);
  outputTable.appendChild(firstRow); // Append the new row to the output table
  mainContainer.scrollTop = mainContainer.scrollHeight; //scroll to bottom
  levelStart();
}
// Function to handle button clicks in inputContainer
function handleSelectGameMode(event) {
  const clickedButton = event.target;
  const buttonContent = parseInt(clickedButton.textContent);
  selectGameMode(buttonContent);
}
function updateHeaderTitle() {
  let titleText = ""; // Update the title based on l_Uncertainty
  for (let i = 0; i <= l_Uncertainty; i++) {
    titleText += fullName[i];
    if (i < l_Uncertainty) {
      titleText += " ";
    }
  }
  document.title = titleText; // Update the document's title
  fetch("./banners.txt") // Load the content of the banners.txt file
    .then((response) => response.text())
    .then((data) => {
      const lines = data.split("\n");
      let selectedLines = [];
      switch (l_Uncertainty) {
        case 0:
          selectedLines = lines.slice(1, 7); // Lines 2 to 7
          break;
        case 1:
          selectedLines = lines.slice(8, 21); // Lines 9 to 21
          break;
        case 2:
          selectedLines = lines.slice(22, 38); // Lines 23 to 38
          break;
      }
      header.innerHTML = selectedLines
        .map((line) => `<pre>${line}</pre>`)
        .join("");
    })
    .catch((error) => {
      console.error("Error fetching or parsing banners.txt:", error);
    });
}
// Function to update slot borders
function updateSlotBorders() {
  leftDivision.querySelectorAll(".slot").forEach((slot, index) => {
    slot.classList.toggle("current", index === currentIndex);
  });
}
function handleInputButtonClick(event) {
  const clickedButton = event.target;
  const buttonClone = clickedButton.cloneNode(true);
  const currentSlot = leftDivision.querySelectorAll(".slot")[currentIndex];
  // Replace existing button or append the clone if the slot is empty
  currentSlot.innerHTML = ""; // Clear the current slot content (if any)
  currentSlot.appendChild(buttonClone);
  currentIndex = findNextEmptySlot(); // Move to the next available empty slot
  updateSlotBorders(); // Update the slot borders based on the new currentIndex
}
function findNextEmptySlot() {
  const slots = Array.from(leftDivision.querySelectorAll(".slot"));
  // Search for the next empty slot starting from the currentIndex + 1
  for (let i = currentIndex + 1; i < slots.length; i++) {
    if (!slots[i].children.length) return i;
  }
  // Search from the beginning if no empty slot was found after currentIndex
  for (let i = 0; i < currentIndex; i++) {
    if (!slots[i].children.length) return i;
  }
  return (currentIndex + 1) % n_Slots; // Increment the currentIndex and loop back to the first slot
}

function levelStart() {
  updateHeaderTitle();
  startTime = performance.now(); // Store the current time
  guesses = [];
  leftDivision.innerHTML = ""; // Create the slots dynamically based on n_Slots
  for (let i = 1; i <= n_Slots; i++) {
    const slotElement = document.createElement("div");
    slotElement.classList.add("slot");
    slotElement.id = `slot${i}`;
    leftDivision.appendChild(slotElement);
  }
  currentIndex = 0;
  updateSlotBorders();

  inputButtons.forEach((button, index) => {
    button.removeEventListener("click", handleInputButtonClick);
    if (index >= n_Choices) {
      button.classList.add("disabled"); // Add the "disabled" class to buttons beyond the limit
    } else {
      button.addEventListener("click", handleInputButtonClick);
      button.classList.remove("disabled"); // Remove the "disabled" class only if it exists
    }
  });

  const minNumber = Math.pow(n_Choices, n_Slots);
  const maxNumber = 2 * minNumber - 1;
  const randomDecimal =
    Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
  randomAnswer = randomDecimal.toString(n_Choices).slice(1); // Generate random answer
  levelMap = {
    level: level,
    n_Choices: n_Choices,
    n_Slots: n_Slots,
    l_Uncertainty: l_Uncertainty,
    answer: randomAnswer,
  }; // Create an embedded document object
  feedback.length = 0; // Clear the feedback array
  // If l_Uncertainty is 1
  if (l_Uncertainty === 1) {
    randomRight = Math.floor(Math.random() * availableHints.length); // Generate a random index within the length of hints as randomRight
    do {
      randomWrong = Math.floor(Math.random() * availableHints.length); // Generate another random index within the length of hints as random_wrong
    } while (randomWrong === randomRight); // Ensure they are different
  }
}
function turnCount(randomAnswer, guess) {
  let rights = 0;
  let wrongs = 0;
  const answerFreq = {};
  const guessFreq = {};
  for (let i = 0; i < randomAnswer.length; i++) {
    const a = randomAnswer[i];
    const g = guess[i];
    if (a === g) {
      rights++;
    } else {
      answerFreq[a] = (answerFreq[a] || 0) + 1;
      guessFreq[g] = (guessFreq[g] || 0) + 1;
    }
  }
  for (const a in answerFreq) {
    if (guessFreq.hasOwnProperty(a)) {
      wrongs += Math.min(answerFreq[a], guessFreq[a]);
    }
  }
  return [wrongs, rights];
}
// Append the wrongs and rights values to the second column
function displayFeedback(
  wrongs,
  rights,
  l_Uncertainty,
  randomWrong,
  randomRight
) {
  const secondColumnCell = document.createElement("td");
  secondColumnCell.classList.add("large");
  if (l_Uncertainty === 0) {
    secondColumnCell.innerHTML = `${"Ⓦ".repeat(
      wrongs
    )}<span class="rightHint">${"Ⓡ".repeat(rights)}</span>`;
  } else {
    rightHint = availableHints[randomRight]; // Handle the case where l_Uncertainty is not 0
    wrongHint = availableHints[randomWrong];
    // Handle the order of hints based on random values
    const orderedHints =
      randomRight < randomWrong
        ? `<span>${rightHint.repeat(rights)}</span>${wrongHint.repeat(wrongs)}`
        : `${wrongHint.repeat(wrongs)}<span>${rightHint.repeat(rights)}</span>`;
    secondColumnCell.innerHTML = orderedHints;
    if (l_Uncertainty === 2) {
      if (rights !== 0) {
        availableHints = availableHints.filter((hint) => hint !== rightHint); // Remove rightHint from availableHints
      }
      if (wrongs !== 0) {
        availableHints = availableHints.filter((hint) => hint !== wrongHint); // Remove wrongHint from availableHints
      }
    }
  }
  return secondColumnCell;
}
function levelWon() {
  levelMap.guesses = guesses;
  levelMap.wrongs = feedback.map((pair) => pair[0]);
  levelMap.rights = feedback.map((pair) => pair[1]);
  checkLevelsArray(levelMap);
  inputButtons.forEach((button) => {
    button.removeEventListener("click", handleInputButtonClick);
    button.classList.add("disabled");
  });
  const spanElements = outputTable.querySelectorAll("tr span"); // Select all <span> elements within the output table rows
  spanElements.forEach((spanElement) => {
    spanElement.classList.add("rightHint"); // Loop through the <span> elements and add the rightHint class
  });

  const slotsInLeftTemp = leftDivision.querySelectorAll(".slot"); // Append direction buttons to the first 3 slots in left temp div
  for (let i = 0; i < directionButtons.length; i++) {
    slotsInLeftTemp[i].innerHTML = directionButtons[i];
  }
  if (level === gameMode) {
    gameEnd(true);
  } else {
    availableHints = availableHints.filter(
      (hint) => hint !== wrongHint && hint !== rightHint
    ); // Remove wrongHint and rightHint from availableHints
    if (gameMode === 3) {
      const sameOptions = [
        ["<", "any direction to next level"],
        ["v", "any direction to next level"],
        [">", "any direction to next level"],
      ];
      sameOptions.forEach((rowContent) => {
        const newRow = document.createElement("tr");
        rowContent.forEach((cellContent) => {
          const cell = document.createElement("td");
          cell.innerHTML = cellContent;
          newRow.appendChild(cell);
        });
        outputTable.appendChild(newRow);
        mainContainer.scrollTop = mainContainer.scrollHeight; //scroll to bottom
      });
    } else {
      // Loop through the <span> elements and add the rightHint class
      spanElements.forEach((spanElement) => {
        spanElement.classList.add("rightHint");
      });
      const difficultyOptions = [
        ["<", "number of colours +=2 (max 10)"],
        ["v", "level of uncertainty +=1 (max 2)"],
        [">", "number of slots +=1 (max 6)"],
      ];
      difficultyOptions.forEach((rowContent) => {
        const newRow = document.createElement("tr");
        rowContent.forEach((cellContent) => {
          const cell = document.createElement("td");
          cell.innerHTML = cellContent;
          newRow.appendChild(cell);
        });
        outputTable.appendChild(newRow);
        mainContainer.scrollTop = mainContainer.scrollHeight; //scroll to bottom
      });
    }
    const difficultyLeftCell = document.createElement("td");
    const difficultyRightCell = document.createElement("td");
    function vaildDirectionButtonClick() {
      // Remove all buttons from slots
      slotsInLeftTemp.forEach((slot) => {
        slot.innerHTML = ""; // Clear the content of the slot
      });
      // Increment chanceRemaining, l_Uncertainty, and level
      chanceRemaining += gameMode;
      enterRight.innerHTML = chanceRemaining;
      level++;
      const firstRow = document.createElement("tr"); // Insert cells in the first column of the output table for level info
      const left1Cell = Object.assign(document.createElement("td"), {
        textContent: `Level`,
      });
      firstRow.appendChild(left1Cell);
      const right1Cell = Object.assign(document.createElement("td"), {
        textContent: `${level - 1} => ${level}`,
      });
      firstRow.appendChild(right1Cell);
      outputTable.appendChild(firstRow); // Append the new row to the output table
      const secondRow = document.createElement("tr"); // Insert cells in the first column of the output table for level info
      const left2Cell = Object.assign(document.createElement("td"), {
        textContent: `Remaining chances`,
      });
      secondRow.appendChild(left2Cell);
      const right2Cell = Object.assign(document.createElement("td"), {
        textContent: `${chanceRemaining - gameMode} => ${chanceRemaining}`,
      });
      secondRow.appendChild(right2Cell);
      outputTable.appendChild(secondRow); // Append the new row to the output table
      const thridRow = document.createElement("tr"); // Insert cells in the first column of the output table for level info
      thridRow.appendChild(difficultyLeftCell);
      thridRow.appendChild(difficultyRightCell);
      outputTable.appendChild(thridRow); // Append the new row to the output table
      mainContainer.scrollTop = mainContainer.scrollHeight; //scroll to bottom
      leftDivision.removeEventListener("click", handleDirectionButtonClick); // Later, if you need to remove the event listener
      levelStart(); // Call the levelStart() function to set up the next level
    }
    // Define the event listener function
    function handleDirectionButtonClick(event) {
      const target = event.target; // Get the clicked element
      // Check if the clicked element is a button
      if (target.tagName === "BUTTON") {
        const directionButton = target; // The clicked button
        // Determine the next level based on the direction button clicked
        if (directionButton.textContent === "v" || gameMode === 3) {
          if (l_Uncertainty < 2) {
            l_Uncertainty++;
            difficultyLeftCell.textContent = `Level of uncertainty`;
            difficultyRightCell.textContent = `${
              l_Uncertainty - 1
            } => ${l_Uncertainty}`;
            vaildDirectionButtonClick();
          }
        } else if (directionButton.textContent === "<") {
          if (n_Choices < 10) {
            n_Choices += 2;
            difficultyLeftCell.textContent = `Number of colours`;
            difficultyRightCell.textContent = `${
              n_Choices - 2
            } => ${n_Choices}`;
            vaildDirectionButtonClick();
          }
        } else if (directionButton.textContent === ">") {
          if (n_Slots < 6) {
            n_Slots++;
            difficultyLeftCell.textContent = `Number of slots`;
            difficultyRightCell.textContent = `${n_Slots - 1} => ${n_Slots}`;
            vaildDirectionButtonClick();
          }
        }
      }
    }
    leftDivision.addEventListener("click", handleDirectionButtonClick); // Add the event listener
  }
}
function gameEnd(ifWin) {
  ifWinFlag = ifWin;
  gameEndRows = null; // Add additional rows
  if (ifWin) {
    // Calculate the sum of elapsed times
    sumElapsedTime =
      levelsArray.reduce((sum, levelMap) => {
        return sum + levelMap.time;
      }, 0) / 1000; // Convert to seconds
    let aveElapsedTime = sumElapsedTime / gameMode;
    gameEndRows = [
      [
        { content: "You win!" },
        { content: `you complete ${gameMode} levels.` },
      ],
      [{ content: "Remaining chance(s)" }, { content: `${chanceRemaining}` }],
      [
        { content: "Time used" },
        {
          content: `${Math.floor(sumElapsedTime / 60)} mins ${(
            sumElapsedTime % 60
          ).toFixed(3)} seconds`,
        },
      ],
    ];
    if (publicBest) {
      let congratulations = checkBest(
        chanceRemaining,
        aveElapsedTime,
        publicBest,
        true,
        gameMode
      );
      if (congratulations) {
        gameEndRows.push(congratulations);
      }
      if (personalBest) {
        congratulations = checkBest(
          chanceRemaining,
          aveElapsedTime,
          personalBest,
          false,
          gameMode
        );
        if (congratulations) {
          gameEndRows.push(congratulations);
        }
      }
    } else {
      gameEndRows.push([
        { content: "Sorry," },
        { content: "records reading not available." },
      ]);
    }
    try {
      updateDoc(docRef, {
        resultScore: chanceRemaining,
        secondsPerLevel: sumElapsedTime / gameMode,
      });
      console.log("Game doc updated in FireStore");
    } catch {}
  } else {
    const spanElements = outputTable.querySelectorAll("tr span"); // Select all <span> elements within the output table rows
    // Loop through the <span> elements and add the rightHint class
    spanElements.forEach((spanElement) => {
      spanElement.classList.add("rightHint");
    });
    let answerString = ""; // Convert randomAnswer into a string of corresponding elements
    for (let i = 0; i < randomAnswer.length; i++) {
      const digit = parseInt(randomAnswer[i]);
      if (!isNaN(digit) && digit >= 0 && digit < outputNumbers.length) {
        answerString += outputNumbers[digit];
      }
    }
    gameEndRows = [
      [
        { content: "You lose!" },
        { content: `use up chance at ${level} out of ${gameMode} levels.` },
      ],
      [
        { content: answerString, className: "large" },
        { content: "correct answer" },
      ],
    ];
    const slotsInLeftTemp = leftDivision.querySelectorAll(".slot"); // Append direction buttons to the first 3 slots in left temp div
    for (let i = 0; i < directionButtons.length; i++) {
      slotsInLeftTemp[i].innerHTML = directionButtons[i];
    }
    levelMap.guesses = guesses;
    levelMap.wrongs = feedback.map((pair) => pair[0]);
    levelMap.rights = feedback.map((pair) => pair[1]);
    checkLevelsArray(levelMap);
    try {
      updateDoc(docRef, {
        levels: levelsArray,
        resultScore: level - gameMode - 1,
      });
      console.log("Game doc updated in FireStore");
    } catch {}
  }
  gameEndRows.push(
    [{ content: "<" }, { content: "view statistics to see how well you did" }],
    [{ content: "v" }, { content: "share so others know how well you did" }],
    [{ content: ">" }, { content: "view credit" }],
    [
      { content: outputNumbers[3], className: "large" },
      { content: "3 levels" },
    ],
    [
      { content: outputNumbers[7], className: "large" },
      { content: "2+5 (chossible out of 25 optional) levels" },
    ]
  );
  gameEndRows.forEach((rowContent) => {
    const newRow = document.createElement("tr");
    rowContent.forEach((cellData) => {
      const cell = document.createElement("td");
      if (cellData.className) {
        cell.classList.add(cellData.className); // Check if className exists and add it
      }
      cell.innerHTML = cellData.content;
      newRow.appendChild(cell);
    });
    outputTable.appendChild(newRow);
    mainContainer.scrollTop = mainContainer.scrollHeight; //scroll to bottom
  });
  leftDivision.addEventListener("click", handleRecommendations); // Add the event listener
  try {
    updateDoc(docRef, { levels: levelsArray });
    console.log("Game doc updated in FireStore");
  } catch {}
  gameMode = null;
  resetGameModeButtons();
}
function resetGameModeButtons() {
  inputButtons.forEach((button) => {
    const buttonValue = button.textContent.trim();
    if (buttonValue == "3" || buttonValue == "7") {
      button.removeEventListener("click", handleInputButtonClick);
      button.addEventListener("click", handleSelectGameMode);
      button.classList.remove("disabled");
    } else {
      button.classList.add("disabled");
      button.removeEventListener("click", handleInputButtonClick);
    }
  });
}

window.addEventListener("beforeunload", handleBeforeUnload); // Add the event listener for beforeunload
// Function to handle the beforeunload event
function handleBeforeUnload(e) {
  gameStopped();
  if (gameMode) {
    e.preventDefault(); // This line prevents the default behavior, which shows the dialog
    e.returnValue =
      "You have an unfinished game. Are you sure you want to leave?";
  }
}

// Function to stop the game and set confirmUnload to false
async function gameStopped() {
  if (gameMode) {
    levelMap.guesses = guesses;
    levelMap.wrongs = feedback.map((pair) => pair[0]);
    levelMap.rights = feedback.map((pair) => pair[1]);
    checkLevelsArray(levelMap);
    try {
      updateDoc(docRef, {
        levels: levelsArray,
        resultScore: level - gameMode - 1,
      });
      console.log("Game doc updated in FireStore");
    } catch {}
  }
}
questionButton.addEventListener("mousedown", overlayAppear); // Add event listeners for mouse and touch events
questionButton.addEventListener("mouseup", overlayDisappear); // Add event listeners for mouse and touch events
questionButton.addEventListener("touchstart", overlayAppear); // Mobile touch events
questionButton.addEventListener("touchend", overlayDisappear); // Mobile touch events
function overlayAppear(event) {
  const buttonRect = questionButton.getBoundingClientRect(); // Get the position of the button relative to the viewport
  overlay.classList.add("overlay-visible"); // Show the overlay
  if (window.innerWidth <= 768) {
    // For phone browsers (width <= 768px)
    const overlayHeight = buttonRect.top + window.scrollY; // Distance from the top edge of the viewport to the top edge of the button
    overlay.style.height = `${overlayHeight}px`; // Set height from top to button
    overlay.style.width = "100vw"; // Full viewport width
  } else {
    // For desktop browsers
    const overlayWidth = buttonRect.left + window.scrollX; // Distance from the left edge of the viewport to the left edge of the button
    overlay.style.width = `${overlayWidth}px`; // Set width from left to button
    overlay.style.height = "100vh"; // Full viewport height
  }
}
function overlayDisappear(event) {
  overlay.classList.remove("overlay-visible"); // Hide the overlay
}
function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}
function checkLevelsArray(levelMap) {
  const index = levelsArray.findIndex((item) => item.level === levelMap.level); // Find the index of the existing item with the same level
  if (index !== -1) {
    levelsArray[index] = levelMap; // If found, replace the existing item with levelMap
  } else {
    levelsArray.push(levelMap); // If not found, push levelMap to levelsArray
  }
}
async function searchBest(isPublic = true, userIP = null) {
  const results = { gameMode3: [], gameMode7: [] }; // Store results for both game modes
  const now = Timestamp.now();
  const gameModes = [
    { mode: 3, lastRecordHold: null, key: "gameMode3" },
    { mode: 7, lastRecordHold: null, key: "gameMode7" },
  ]; // Loop through both game modes
  for (const { mode, key } of gameModes) {
    for (const timeframe of timeframes) {
      const lastRecordHold = gameModes.find(
        (gm) => gm.mode === mode
      ).lastRecordHold;
      // Skip if the record hold is less than the current timeframe duration
      if (lastRecordHold !== null && lastRecordHold <= timeframe.duration) {
        results[key].push(results[key][results[key].length - 1]); // Push the last result
        continue;
      }
      const lastDuration =
        timeframe.duration === Infinity ? 0 : now.seconds - timeframe.duration;
      const lastTimestamp = new Timestamp(lastDuration, 0);
      // Build query with common conditions, adding IP filter for personal bests if needed
      let q = query(
        colRef,
        where("gameMode", "==", mode), // Filter by game mode
        where("dateTime", ">=", lastTimestamp),
        ...(isPublic || !userIP ? [] : [where("ipAddress", "==", userIP)]) // Conditionally add IP filter
      );
      try {
        const querySnapshot = await getDocs(q); // Execute the query
        if (!querySnapshot.empty) {
          const { resultScore, secondsPerLevel, dateTime } = querySnapshot.docs
            .map((doc) => doc.data())
            .sort((a, b) =>
              b.resultScore !== a.resultScore
                ? b.resultScore - a.resultScore
                : a.secondsPerLevel - b.secondsPerLevel
            )[0]; // Get best result based on score & time per level
          const lowestSecondsPerLevel = secondsPerLevel || null;
          gameModes.find((gm) => gm.mode === mode).lastRecordHold =
            now.seconds - dateTime.seconds; // Update record hold
          results[key].push([resultScore, lowestSecondsPerLevel]);
        } else {
          results[key].push([null, null]); // No results found for this timeframe
        }
      } catch (error) {
        console.error(
          `Error retrieving documents for ${timeframe.label} in game mode ${mode}: `,
          error
        );
      }
    }
  }
  console.log(
    "Results 3:",
    isPublic ? "Public" : `for IP ${userIP}`,
    results.gameMode3,
    "Results 7:",
    isPublic ? "Public" : `for IP ${userIP}`,
    results.gameMode7
  );
  return results; // Return results for both game modes
}
function checkBest(
  chanceRemaining,
  aveElapsedTime,
  bestResults,
  isPublic,
  gameMode
) {
  const results =
    gameMode === 3 ? bestResults.gameMode3 : bestResults.gameMode7; // Check if bestResults has data for both game modes
  for (let i = 0; i < results.length; i++) {
    const [highestScore, lowestSecondsPerLevel] = results[i];
    // Compare chanceRemaining with the highestScore
    if (
      highestScore == null ||
      chanceRemaining > highestScore ||
      (chanceRemaining === highestScore &&
        aveElapsedTime < lowestSecondsPerLevel)
    ) {
      const bestType = isPublic ? "public" : "personal";
      return [
        { content: "Congratulations!" },
        { content: `It's a ${bestType} ${timeframes[i].label} best.` },
      ];
    }
  }
  return null; // Return null if no best score is found
}
