import {
  serverTimestamp,
  addDoc,
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { colRef, userIP } from "./index.js";
const numberButtons = [
  '<button value="⓪" type="button" class="numberButton white">0</button>',
  '<button value="①" type="button" class="numberButton green">1</button>',
  '<button value="②" type="button" class="numberButton yellow">2</button>',
  '<button value="③" type="button" class="numberButton red">3</button>',
  '<button value="④" type="button" class="numberButton blue">4</button>',
  '<button value="⑤" type="button" class="numberButton black">5</button>',
  '<button value="⑥" type="button" class="numberButton purple">6</button>',
  '<button value="⑦" type="button" class="numberButton lime">7</button>',
  '<button value="⑧" type="button" class="numberButton aqua">8</button>',
  '<button value="⑨" type="button" class="numberButton fuchsia">9</button>',
];
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
const enterButton = document.createElement("button");
const fullName = ["MasterMind", "II: CHAOTIC", "EVIL"];
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
  gameDoc;

const inputContainer = document.getElementById("inputContainer");
const leftDivision = document.querySelector(".left_temp");
const rightDivision = document.querySelector(".right_temp");
const header = document.querySelector(".header");
const outputTable = document.querySelector("main.output table");

document.addEventListener("DOMContentLoaded", setUpTable);

function setUpTable() {
  updateHeaderTitle();
  // Event listener for keydown events
  document.addEventListener("keydown", function (event) {
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
      (keyCode === 188 || keyCode === 54 || keyCode === 190)
    ) {
      // Comma (<), Caret (^), or Period (>)
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
      // Move currentIndex back by 1, wrapping around if necessary
      currentIndex = (currentIndex + n_Slots - 1) % n_Slots;

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
      // Move currentIndex left by 1, wrapping around if necessary
      currentIndex = (currentIndex + n_Slots - 1) % n_Slots;
      updateSlotBorders();
    }
    // Check if the pressed key is the Right arrow key
    else if (keyCode === 39) {
      // Move currentIndex right by 1, wrapping around if necessary
      currentIndex = (currentIndex + 1) % n_Slots;
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
  });
  inputContainer.innerHTML = numberButtons.join(""); // Add all number buttons to the inputContainer

  // Function to handle button clicks in inputContainer
  function handleInputButtonClick(event) {
    const clickedButton = event.target;
    const buttonContent = parseInt(clickedButton.textContent);
    if (buttonContent === 3 || buttonContent === 7) {
      selectGameMode(buttonContent);
    }
  }
  const inputButtons = inputContainer.querySelectorAll("button"); // Attach click event listeners to the buttons in inputContainer
  inputButtons.forEach((button) => {
    button.addEventListener("click", handleInputButtonClick);
  });

  enterButton.textContent = "Remaining chance(s)"; // Create the Enter button
  rightDivision.appendChild(enterButton);

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
          const elapsedTimeInMinute = Math.floor(
            elapsedTimeInMilliseconds / 1000 / 60
          );
          const elapsedTimeInSecond =
            elapsedTimeInMilliseconds / 1000 - elapsedTimeInMinute * 60;
          secondColumnCell.innerHTML = `${elapsedTimeInMinute.toFixed(
            0
          )} minute(s) ${elapsedTimeInSecond.toFixed(3)} seconds`;
          newRow.appendChild(secondColumnCell);
          outputTable.appendChild(newRow);
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
  // Function for Game mode buttons
  function selectGameMode(game_Mode) {
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
    }; // Create an empty JavaScript object to represent the Firestore document
    updateEnterButton();
    // Remove buttons from slots
    Array.from(leftDivision.querySelectorAll(".slot button")).forEach(
      (button) => button.remove()
    );
    gameMode = game_Mode; // Set the game mode
    const firstRow = document.createElement("tr"); // Create a new row in the output table
    const levelInfoCell = document.createElement("td"); // Insert cells in the first column of the output table
    levelInfoCell.textContent = `Level ${level - 1} => ${level}`;
    firstRow.appendChild(levelInfoCell);
    const emptyCell = document.createElement("td");
    firstRow.appendChild(emptyCell);
    outputTable.appendChild(firstRow); // Append the new row to the output table
    levelStart();
  }
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
  inputContainer.innerHTML = numberButtons.slice(0, n_Choices).join(""); // Add the number buttons to the inputContainer

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
  const inputButtons = inputContainer.querySelectorAll("button"); // Attach click event listeners to the buttons in inputContainer
  inputButtons.forEach((button) => {
    button.addEventListener("click", handleInputButtonClick);
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
  levelsArray.push(levelMap);
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
      const instructionRow = document.createElement("tr"); // Create a new row in the output table for the instruction
      const instructionCell = document.createElement("td");
      instructionCell.textContent = `Any direction to next level`;
      instructionCell.colSpan = 2; // Span two columns
      instructionRow.appendChild(instructionCell);
      outputTable.appendChild(instructionRow);
    } else {
      // Loop through the <span> elements and add the rightHint class
      spanElements.forEach((spanElement) => {
        spanElement.classList.add("rightHint");
      });
      const difficultyOptions = [
        ["<", "number of choices +=2 (max 10)"],
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
      });
    }
    const slotsInLeftTemp = leftDivision.querySelectorAll(".slot"); // Append direction buttons to the first 3 slots in left temp div
    for (let i = 0; i < 3; i++) {
      const directionButton = slotsInLeftTemp[i].querySelector("button");
      // Add event listener to direction buttons
      directionButton.addEventListener("click", function () {
        const difficultyInfoCell = document.createElement("td");
        // Determine the next level based on the direction button clicked
        if (directionButton.textContent === "^" || gameMode === 3) {
          if (l_Uncertainty < 2) {
            l_Uncertainty++;
            difficultyInfoCell.textContent = `Level of uncertainty ${
              l_Uncertainty - 1
            } => ${l_Uncertainty}`;
            vaildDirectionButtonClick();
          }
        } else if (directionButton.textContent === "<") {
          if (n_Choices < 10) {
            n_Choices += 2;
            difficultyInfoCell.textContent = `number of colours ${
              n_Choices - 2
            } => ${n_Choices}`;
            vaildDirectionButtonClick();
          }
        } else if (directionButton.textContent === ">") {
          if (n_Slots < 6) {
            n_Slots++;
            difficultyInfoCell.textContent = `number of slots ${
              n_Slots - 1
            } => ${n_Slots}`;
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
          const levelInfoCell = document.createElement("td");
          levelInfoCell.textContent = `Level ${level - 1} => ${level}`;
          firstRow.appendChild(levelInfoCell);
          firstRow.appendChild(difficultyInfoCell);
          outputTable.appendChild(firstRow); // Append the new row to the output table
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
      [`Congratulations!`, `You completed ${gameMode} levels`],
      [
        `Chance(s) remaining: ${chanceRemaining}`,
        `Time used: ${Math.floor(sumElapsedTime / 60)} mins ${(
          sumElapsedTime % 60
        ).toFixed(3)} seconds`,
      ],
    ];
    gameDoc.resultScore = chanceRemaining;
    gameDoc.secondsPerLevel = sumElapsedTime / gameMode;
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
    levelsArray.push(levelMap);
    gameDoc.resultScore = level - gameMode - 1;
  }
  gameEndRows.push(
    ["<(fake)", "share to social media"],
    ["^(fake)", "challenge a friend at your last step"],
    [">(fake)", "view statistics and credit"],
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
  });
  gameDoc.levels = levelsArray;
  addDoc(colRef, gameDoc) // Adding the document
    .then(() => {
      console.log("Document successfully written!");
    })
    .catch((error) => {
      console.error("Error writing document: ", error);
    });
  gameMode = null;
}
let confirmUnload = true;
window.addEventListener("beforeunload", handleBeforeUnload); // Add the event listener for beforeunload
// Function to handle the beforeunload event
function handleBeforeUnload(e) {
  if (gameMode && confirmUnload) {
    e.preventDefault(); // This line prevents the default behavior, which shows the dialog
    e.returnValue =
      "You have an unfinished game. Are you sure you want to leave?";
  }
}
// Add an event listener for unload, which runs when the user decides to leave
window.addEventListener("unload", gameStopped);
// Function to stop the game and set confirmUnload to false
async function gameStopped() {
  if (gameMode) {
    levelMap.guesses = guesses;
    levelMap.wrongs = feedback.map((pair) => pair[0]);
    levelMap.rights = feedback.map((pair) => pair[1]);
    levelsArray.push(levelMap);
    gameDoc.levels = levelsArray;
    gameDoc.resultScore = level - gameMode - 1;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/updateFirestore", false); // Replace with your server endpoint
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    var data = JSON.stringify(gameDoc); // Prepare the data to send
    xhr.send(data); // Send the request
    // await addDoc(gameDoc);
  }
}
function updateEnterButton() {
  enterButton.textContent = `Remaining`; // Update the text content of the enterButton
  enterButton.insertAdjacentHTML("beforeend", "<br>"); // Insert the line break as HTML
  enterButton.insertAdjacentText("beforeend", `${chanceRemaining} chance(s)`);
}
