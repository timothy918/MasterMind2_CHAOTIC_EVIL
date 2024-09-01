import {
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  collection,
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { db, colRef, userIP } from "./index.js";
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
  '<button value="54" type="button" class="numberButton white">^</button>',
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
const mainContainer = document.querySelector("main");
// Declare the variables
const enterButton = Object.assign(document.createElement("button"), {
  textContent: "Beginning chances: 16",
});
const fullName = ["MasterMind II", ": CHAOTIC", "EVIL"];
// Declare the variables
let inputEnable = 1;
let l_Uncertainty = 0;
const feedback = [[], []]; // Declare a list to store feedback: [wrongs, rights]
let availableHints = [];
let levelsArray = [];
let guesses = [];
let elapsedTimeList = []; // List to store elapsed times
let startTime; // Variable to store the start time of the level
let n_Slots,
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
  gameDoc;

const inputContainer = document.getElementById("inputContainer");
const leftDivision = document.querySelector(".left_temp");
const rightDivision = document.querySelector(".right_temp");
const header = document.querySelector(".header");
const outputTable = document.querySelector("main.output table");
const inputButtons = inputContainer.querySelectorAll(".numberButton"); // Get all the button elements within inputContainer
document.addEventListener("DOMContentLoaded", setUpTable);

const questionButton = document.getElementById("question");
const overlay = document.getElementById("overlay");
questionButton.addEventListener("mousedown", function () {
  overlay.classList.add("overlay-visible");
  const buttonRect = questionButton.getBoundingClientRect(); // Get the button's position
  // Position the overlay
  overlay.style.top = `0px`; // Align the top of the overlay with the top of the window
  overlay.style.left = `${
    buttonRect.left + window.scrollX - overlay.offsetWidth
  }px`; // Align the right border of the overlay to the left of the button
});
questionButton.addEventListener("mouseup", function () {
  overlay.classList.remove("overlay-visible");
});

function setUpTable() {
  updateHeaderTitle();
  function handleKeybroad(event) {
    const keyCode = event.keyCode || event.which; // Get the pressed key code
    // Check if the game mode is set
    if (!gameMode) {
      if (keyCode === 51) {
        selectGameMode(3); // 3 key
      } else if (keyCode === 55) {
        selectGameMode(7); // 7 key
      }
    } else if (
      !inputEnable &&
      (keyCode === 188 || keyCode === 54 || keyCode === 190) // Comma (<), Caret (^), or Period (>)
    ) {
      // Find the direction button with the corresponding value in leftDivision
      const directionButton = leftDivision.querySelector(
        `.numberButton[value="${keyCode}"]`
      );

      // Trigger the click event on the direction button
      if (directionButton && event.target === document.body) {
        directionButton.click();
      }
    } else if (keyCode >= 48 && keyCode <= 57) {
      // Number keys 0-9
      const number = keyCode - 48; // Convert key code to number
      const numberButtons = inputContainer.querySelectorAll(".numberButton"); // Loop through the number buttons to find the matching button by textContent
      for (const button of numberButtons) {
        if (button.textContent === String(number)) {
          // Trigger the click event on the corresponding number button
          if (event.target === document.body) {
            button.click();
          }
          break; // Exit the loop once the button is found
        }
      }
    }
    // Check if the pressed key is the Return key (Enter)
    if (keyCode === 13) {
      // Trigger the click event on the Start or Enter button
      if (enterButton && event.target === document.body) {
        enterButton.click();
      }
    }
    // Check if the pressed key is the Backspace key
    else if (keyCode === 8) {
      currentIndex = (currentIndex + n_Slots - 1) % n_Slots; // Move currentIndex back by 1, wrapping around if necessary

      // Remove the button from the targeted slot
      const currentSlot = leftDivision.querySelectorAll(".slot")[currentIndex];
      const buttonInSlot = currentSlot.querySelector("button");
      if (buttonInSlot) {
        buttonInSlot.remove();
      }
      updateSlotBorders();
    }
    // Check if the pressed key is the Left arrow key
    else if (keyCode === 37) {
      currentIndex = (currentIndex + n_Slots - 1) % n_Slots; // Move currentIndex left by 1, wrapping around if necessary
      updateSlotBorders();
    }
    // Check if the pressed key is the Right arrow key
    else if (keyCode === 39) {
      currentIndex = (currentIndex + 1) % n_Slots; // Move currentIndex right by 1, wrapping around if necessary
      updateSlotBorders();
    }
    // Check if the pressed key is the Space key
    else if (keyCode === 32) {
      // Trigger the click event on the button in the target slot
      const currentSlot = leftDivision.querySelectorAll(".slot")[currentIndex];
      const buttonInSlot = currentSlot.querySelector("button");
      if (buttonInSlot) {
        buttonInSlot.click();
      }
    }
  }
  document.removeEventListener("keydown", handleKeybroad);
  document.addEventListener("keydown", handleKeybroad); // Event listener for keydown events

  resetGameModeButton();

  rightDivision.prepend(enterButton); // Put Enter button in position

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
        updateEnterButton();
        currentIndex = 0; // Reset the currentIndex and update slot borders
        updateSlotBorders();
        const [wrongs, rights] = turnCount(randomAnswer, guess); // Call the turnCount function with randomAnswer and guess
        feedback.push([wrongs, rights]);
        const firstColumnCell = document.createElement("td"); // Append the guess to the first column
        let buttonElement = "";
        buttonsInSlots.forEach((button) => {
          buttonElement += outputNumbers[button.textContent];
          firstColumnCell.innerHTML = buttonElement;
        });
        newRow.appendChild(firstColumnCell);
        if (l_Uncertainty === 2) {
          if (availableHints.length === 0) {
            availableHints = [...hints];
          } // Check if availableHints is empty, reset it to hints
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
          scrollToBottom(mainContainer);
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
          scrollToBottom(mainContainer);
          // Check if remaining chances are zero and display "You lose"
          if (chanceRemaining === 0) {
            gameEnd(0);
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
      handleLeftDivisionButtonClick(event);
      updateSlotBorders(); // Update slot borders based on currentIndex
    }
  });
}
// Function for Game mode buttons
function selectGameMode(game_Mode) {
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
    isReal: true,
    ipAddress: userIP,
    gameMode: game_Mode,
    dateTime: serverTimestamp(),
    resultScore: -game_Mode,
  }; // Create an empty JavaScript object to represent the Firestore document
  const colRef = collection(db, "GamesPlayed"); // Reference to the Firestore collection
  addDoc(colRef, gameDoc) // Add the gameDoc to Firebase and get the document reference
    .then((x) => {
      console.log(x.id);
      docRef = doc(db, "GamesPlayed", x.id);
    })
    .catch((error) => {
      console.error("Error writing document: ", error);
    });

  updateEnterButton();
  // Remove buttons from slots
  Array.from(leftDivision.querySelectorAll(".slot button")).forEach((button) =>
    button.remove()
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
  scrollToBottom(mainContainer);
  levelStart();
}
// Function to handle button clicks in inputContainer
function handleSelectGameMode(event) {
  const clickedButton = event.target;
  const buttonContent = parseInt(clickedButton.textContent);
  selectGameMode(buttonContent);
}
// Function to handle button clicks in left division (to remove buttons)
function handleLeftDivisionButtonClick(event) {
  const clickedSlot = event.target.closest(".slot");
  if (clickedSlot) {
    const clickedButton = clickedSlot.querySelector("button");
    // Remove the button from the clicked slot
    if (clickedButton) {
      clickedButton.remove();
    }
    // Get the index of the clicked slot and set it as the current target slot
    const clickedSlotIndex = Array.from(
      leftDivision.querySelectorAll(".slot")
    ).indexOf(clickedSlot);
    currentIndex = clickedSlotIndex;
    updateSlotBorders(); // Update slot borders based on currentIndex
  }
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
  fetch("banners.txt") // Load the content of the banners.txt file
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
      const header = document.querySelector(".header");
      header.innerHTML = selectedLines
        .map((line) => `<pre>${line}</pre>`)
        .join("");
    })
    .catch((error) => {
      console.error("Error fetching or parsing banners.txt:", error);
    });
  window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll the user back to the top of the page with a smooth effect
}
// Function to update slot borders
function updateSlotBorders() {
  leftDivision.querySelectorAll(".slot").forEach((slot, index) => {
    slot.classList.toggle("current", index === currentIndex);
  });
}
// Function to handle button clicks in inputContainer
function handleInputButtonClick(event) {
  const clickedButton = event.target;
  if (inputEnable) {
    const buttonClone = clickedButton.cloneNode(true);
    const currentSlot = leftDivision.querySelectorAll(".slot")[currentIndex]; // Get the current target slot

    // If the slot is empty, append the button clone; otherwise, replace the existing button
    if (currentSlot.children.length === 0) {
      currentSlot.appendChild(buttonClone);
    } else {
      currentSlot.removeChild(currentSlot.firstChild);
      currentSlot.appendChild(buttonClone);
    }
    currentIndex = (currentIndex + 1) % n_Slots; // Increment the currentIndex and loop back to the first slot
    updateSlotBorders(); // Update slot borders based on currentIndex
  }
}
function levelStart() {
  updateHeaderTitle();
  availableHints = [...hints];
  startTime = performance.now(); // Store the current time
  inputEnable = 1;
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

  const numberButtons = inputContainer.querySelectorAll(".numberButton");
  numberButtons.forEach((button, index) => {
    button.removeEventListener("click", handleInputButtonClick);
    if (index >= n_Choices) {
      button.classList.add("disabled"); // Add the "disabled" class to buttons beyond the limit
    } else {
      button.addEventListener("click", handleInputButtonClick);
      if (button.classList.contains("disabled")) {
        button.classList.remove("disabled"); // Remove the "disabled" class only if it exists
      }
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
    randomRight = Math.floor(Math.random() * hints.length); // Generate a random index within the length of hints as randomRight
    do {
      randomWrong = Math.floor(Math.random() * hints.length); // Generate another random index within the length of hints as random_wrong
    } while (randomWrong === randomRight); // Ensure they are different
  } else if (l_Uncertainty === 0) {
    const randomRight = 1;
    const randomWrong = 0;
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
  if (l_Uncertainty === 0) {
    secondColumnCell.innerHTML = `${"Ⓦ".repeat(
      wrongs
    )}<span class="rightHint">${"Ⓡ".repeat(rights)}</span>`;
  } else {
    const rightHint = availableHints[randomRight]; // Handle the case where l_Uncertainty is not 0
    const wrongHint = availableHints[randomWrong];
    if (randomRight < randomWrong) {
      secondColumnCell.innerHTML = `<span>${rightHint.repeat(
        rights
      )}</span>${wrongHint.repeat(wrongs)}`;
    } else {
      secondColumnCell.innerHTML = `${wrongHint.repeat(
        wrongs
      )}<span>${rightHint.repeat(rights)}</span>`;
    }
    if (l_Uncertainty === 2) {
      // Remove wrongHint and rightHint from availableHints
      availableHints = availableHints.filter(
        (hint) => hint !== wrongHint && hint !== rightHint
      );
    }
  }
  return secondColumnCell;
}
function levelWon() {
  levelMap.guesses = guesses;
  levelMap.wrongs = feedback.map((pair) => pair[0]);
  levelMap.rights = feedback.map((pair) => pair[1]);
  checkLevelsArray(levelMap);
  updateDoc(docRef, { levels: levelsArray });
  inputEnable = null; // Disable number buttons in input section
  const spanElements = outputTable.querySelectorAll("tr span"); // Select all <span> elements within the output table rows
  // Loop through the <span> elements and add the rightHint class
  spanElements.forEach((spanElement) => {
    spanElement.classList.add("rightHint");
  });

  const slotsInLeftTemp = leftDivision.querySelectorAll(".slot"); // Append direction buttons to the first 3 slots in left temp div
  for (let i = 0; i < 3; i++) {
    slotsInLeftTemp[i].innerHTML = directionButtons[i];
  }
  if (level === gameMode) {
    gameEnd(1);
  } else {
    if (gameMode === 3) {
      const sameOptions = [
        ["<", "any direction to next level"],
        ["^", "any direction to next level"],
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
        scrollToBottom(mainContainer);
      });
    } else {
      // Loop through the <span> elements and add the rightHint class
      spanElements.forEach((spanElement) => {
        spanElement.classList.add("rightHint");
      });
      const difficultyOptions = [
        ["<", "number of Colours +=2 (max 10)"],
        ["^", "level of uncertainty +=1 (max 2)"],
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
        scrollToBottom(mainContainer);
      });
    }
    const slotsInLeftTemp = leftDivision.querySelectorAll(".slot"); // Append direction buttons to the first 3 slots in left temp div
    for (let i = 0; i < 3; i++) {
      const directionButton = slotsInLeftTemp[i].querySelector("button");
      // Add event listener to direction buttons
      directionButton.addEventListener("click", function () {
        const difficultyLeftCell = document.createElement("td");
        const difficultyRightCell = document.createElement("td");
        // Determine the next level based on the direction button clicked
        if (directionButton.textContent === "^" || gameMode === 3) {
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
            difficultyLeftCell.textContent = `number of colours`;
            difficultyRightCell.textContent = `${
              n_Choices - 2
            } => ${n_Choices}`;
            vaildDirectionButtonClick();
          }
        } else if (directionButton.textContent === ">") {
          if (n_Slots < 6) {
            n_Slots++;
            difficultyLeftCell.textContent = `number of slots`;
            difficultyRightCell.textContent = `${n_Slots - 1} => ${n_Slots}`;
            vaildDirectionButtonClick();
          }
        }

        function vaildDirectionButtonClick() {
          // Remove all buttons from slots
          slotsInLeftTemp.forEach((slot) => {
            slot.innerHTML = ""; // Clear the content of the slot
          });
          // Increment chanceRemaining, l_Uncertainty, and level
          chanceRemaining += gameMode;
          updateEnterButton();
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
          // firstRow.appendChild(difficultyInfoCell);
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
          scrollToBottom(mainContainer);
          levelStart(); // Call the levelStart() function to set up the next level
        }
      });
    }
  }
}
function gameEnd(ifWin) {
  let gameEndRows; // Add additional rows
  if (ifWin) {
    // Calculate the sum of elapsed times
    sumElapsedTime =
      levelsArray.reduce((sum, levelMap) => {
        return sum + levelMap.time;
      }, 0) / 1000; // Convert to seconds
    gameEndRows = [
      [`You win!`, `you completed ${gameMode} levels`],
      [`Remaining chance(s)`, `${chanceRemaining}`],
      [
        `Time used`,
        `${Math.floor(sumElapsedTime / 60)} mins ${(
          sumElapsedTime % 60
        ).toFixed(3)} seconds`,
      ],
    ];
    updateDoc(docRef, { resultScore: chanceRemaining });
    updateDoc(docRef, { secondsPerLevel: sumElapsedTime / gameMode });
    // gameDoc.resultScore = chanceRemaining;
    // gameDoc.secondsPerLevel = sumElapsedTime / gameMode;
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
      ["You lose!", `at ${level} out of ${gameMode} levels`],
      [answerString, `correct answer`],
    ];
    const slotsInLeftTemp = leftDivision.querySelectorAll(".slot"); // Append direction buttons to the first 3 slots in left temp div
    for (let i = 0; i < 3; i++) {
      slotsInLeftTemp[i].innerHTML = directionButtons[i];
    }
    levelMap.guesses = guesses;
    levelMap.wrongs = feedback.map((pair) => pair[0]);
    levelMap.rights = feedback.map((pair) => pair[1]);
    checkLevelsArray(levelMap);
    updateDoc(docRef, { levels: levelsArray });
    // gameDoc.resultScore = level - gameMode - 1;
    updateDoc(docRef, { resultScore: level - gameMode - 1 });
  }
  gameEndRows.push(
    ["<(fake)", "view statistics to see how well you did"],
    ["^(fake)", "share so others know how well you did"],
    [">(fake)", "view credit page"],
    [outputNumbers[3], "3 levels; or,"],
    [outputNumbers[7], "2+5 (chossible out of 25 optional) levels"]
  );
  gameEndRows.forEach((rowContent) => {
    const newRow = document.createElement("tr");
    rowContent.forEach((cellContent) => {
      const cell = document.createElement("td");
      cell.innerHTML = cellContent;
      newRow.appendChild(cell);
    });
    outputTable.appendChild(newRow);
    scrollToBottom(mainContainer);
  });
  updateDoc(docRef, { levels: levelsArray });
  // gameDoc.levels = levelsArray;
  // addDoc(colRef, gameDoc) // Adding the document
  //   .then(() => {
  //     console.log("Document successfully written!");
  //   })
  //   .catch((error) => {
  //     console.error("Error writing document: ", error);
  //   });
  gameMode = null;
  resetGameModeButton();
}
function resetGameModeButton() {
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

let confirmUnload = true;
window.addEventListener("beforeunload", handleBeforeUnload); // Add the event listener for beforeunload
// Function to handle the beforeunload event
function handleBeforeUnload(e) {
  gameStopped();
  if (gameMode && confirmUnload) {
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
    updateDoc(docRef, { levels: levelsArray });
    updateDoc(docRef, { resultScore: level - gameMode - 1 });
    // gameDoc.levels = levelsArray;
    // gameDoc.resultScore = level - gameMode - 1;
  }
}
function updateEnterButton() {
  enterButton.textContent = `Remaining`; // Update the text content of the enterButton
  enterButton.insertAdjacentHTML("beforeend", "<br>"); // Insert the line break as HTML
  enterButton.insertAdjacentText("beforeend", `${chanceRemaining} chance(s)`);
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
