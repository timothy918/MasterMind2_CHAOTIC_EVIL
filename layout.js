const numberButtons = [
  '<button value="0" type="button" class="numberButton white">⓪</button>',
  '<button value="1" type="button" class="numberButton green">①</button>',
  '<button value="2" type="button" class="numberButton yellow">②</button>',
  '<button value="3" type="button" class="numberButton red">③</button>',
  '<button value="4" type="button" class="numberButton blue">④</button>',
  '<button value="5" type="button" class="numberButton black">⑤</button>',
  '<button value="6" type="button" class="numberButton purple">⑥</button>',
  '<button value="7" type="button" class="numberButton lime">⑦</button>',
  '<button value="8" type="button" class="numberButton aqua">⑧</button>',
  '<button value="9" type="button" class="numberButton fuchsia">⑨</button>',
];
const directionButtons = [
  '<button value="<" type="button" class="numberButton white"><</button>',
  '<button value="^" type="button" class="numberButton white">^</button>',
  '<button value=">" type="button" class="numberButton white">></button>',
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
  "Ⓥ",
  "Ⓧ",
  "Ⓨ",
  "Ⓩ",
];
const enterButton = document.createElement("button");
const fullName = ["MasterMind", "II: CHAOTIC", "EVIL"];
// Declare the variables
let nOfSlots = 4;
let nOfChoices = 6;
let lOfUncertainty = 0;
let currentIndex = 0;
let chanceRemaining = 16;
let level = 1;
let inputEnable = 1;
let gameMode, randomAnswer, randomRight, randomWrong;
const feedback = [[], []];

const inputContainer = document.getElementById("inputContainer");
const leftDivision = document.querySelector(".left_temp");
const rightDivision = document.querySelector(".right_temp");
const header = document.querySelector(".header");

document.addEventListener("DOMContentLoaded", setUpTable);

function setUpTable() {
  updateHeaderTitle();
  // Create the slots dynamically based on nOfSlots
  for (let i = 1; i <= nOfSlots; i++) {
    const slotElement = document.createElement("div");
    slotElement.classList.add("slot");
    slotElement.id = `slot${i}`;
    leftDivision.appendChild(slotElement);
  }
  // Event listener for keydown events
  document.addEventListener("keydown", function (event) {
    // Get the pressed key code
    const keyCode = event.keyCode || event.which;
    // Check if the game mode is set
    if (!gameMode) {
      if (keyCode === 51) {
        // 3 key
        selectGameMode(3);
      } else if (keyCode === 55) {
        // 7 key
        selectGameMode(7);
      }
    } else if (keyCode >= 48 && keyCode <= 57) {
      // Number keys 0-9
      const number = keyCode - 48; // Convert key code to number
      const numberButton = inputContainer.querySelector(
        `.numberButton[value="${number}"]`
      );

      // Trigger the click event on the corresponding number button
      if (numberButton && event.target === document.body) {
        numberButton.click();
      }
    }
    // Check if the pressed key is the Return key (Enter)
    if (keyCode === 13) {
      // Trigger the click event on the Start or Enter button
      if (enterButton && event.target === document.body) {
        enterButton.click();
      }
    }
  });
  // Add the number buttons to the inputContainer
  inputContainer.innerHTML = numberButtons.slice(0, nOfChoices).join("");

  // Function to handle button clicks in inputContainer
  function handleInputButtonClick(event) {
    const clickedButton = event.target;

    if (!gameMode) {
      const buttonValue = parseInt(clickedButton.value);
      if (buttonValue === 3 || buttonValue === 7) {
        selectGameMode(buttonValue);
      }
    } else if (inputEnable) {
      const buttonClone = clickedButton.cloneNode(true);

      // Get the current target slot
      const currentSlot = leftDivision.querySelectorAll(".slot")[currentIndex];

      // If the slot is empty, append the button clone; otherwise, replace the existing button
      if (currentSlot.children.length === 0) {
        currentSlot.appendChild(buttonClone);
      } else {
        currentSlot.removeChild(currentSlot.firstChild);
        currentSlot.appendChild(buttonClone);
      }
      // Increment the currentIndex and loop back to the first slot
      currentIndex = (currentIndex + 1) % nOfSlots;
      // Update slot borders based on currentIndex
      updateSlotBorders();
    }
  }

  // Attach click event listeners to the buttons in inputContainer
  const inputButtons = inputContainer.querySelectorAll("button");
  inputButtons.forEach((button) => {
    button.addEventListener("click", handleInputButtonClick);
  });

  // Create the Enter button
  enterButton.textContent = `Remaining`;
  rightDivision.appendChild(enterButton);

  // Insert the line break as HTML
  enterButton.insertAdjacentHTML("beforeend", "<br>");
  enterButton.insertAdjacentText("beforeend", `${chanceRemaining} chance(s)`);

  // Event listener for the Enter button
  enterButton.addEventListener("click", function () {
    const slotsFilled = Array.from(
      leftDivision.querySelectorAll(".slot")
    ).every((slot) => slot.children.length > 0);

    if (slotsFilled) {
      chanceRemaining--;
      // Create a new row in the output table
      const outputTable = document.querySelector("main.output table");
      const newRow = document.createElement("tr");

      // Get the values of buttons in the slots as the guess
      const buttonsInSlots = Array.from(
        leftDivision.querySelectorAll(".slot button")
      );
      const guess = buttonsInSlots.map((button) => button.value);

      // Call the turnCount function with randomAnswer and guess
      const [wrongs, rights] = turnCount(randomAnswer, guess);
      feedback.push([wrongs, rights]);
      // Append the guess to the first column
      const firstColumnCell = document.createElement("td");
      firstColumnCell.textContent = buttonsInSlots
        .map((button) => button.textContent)
        .join("");
      newRow.appendChild(firstColumnCell);

      // Generate randomRight and randomWrong based on lOfUncertainty
      if (lOfUncertainty === 2) {
        randomRight = Math.floor(Math.random() * hints.length);
        do {
          randomWrong = Math.floor(Math.random() * hints.length);
        } while (randomWrong === randomRight);
      }
      // Check if the answer is correct
      if (rights === nOfSlots) {
        const secondColumnCell = document.createElement("td");
        secondColumnCell.textContent = "Answer correct";
        newRow.appendChild(secondColumnCell);
        outputTable.appendChild(newRow);
        levelWon();
      } else {
        // Append the wrongs and rights values to the second column
        let secondColumnCell = displayFeedback(
          wrongs,
          rights,
          lOfUncertainty,
          randomWrong,
          randomRight
        );
        newRow.appendChild(secondColumnCell);
        // Append the new row to the output table
        outputTable.appendChild(newRow);
      }
      // Remove buttons from slots and update chanceRemaining
      buttonsInSlots.forEach((button) => button.remove());

      // Update the text content of the enterButton
      enterButton.textContent = `Remaining`;
      // Insert the line break as HTML
      enterButton.insertAdjacentHTML("beforeend", "<br>");
      enterButton.insertAdjacentText(
        "beforeend",
        `${chanceRemaining} chance(s)`
      );
      // Reset the currentIndex and update slot borders
      currentIndex = 0;
      updateSlotBorders();
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
      // Update slot borders based on currentIndex
      updateSlotBorders();
    }
  });
  // Function for Game mode buttons
  function selectGameMode(game_Mode) {
    // Remove buttons from slots
    Array.from(leftDivision.querySelectorAll(".slot button")).forEach(
      (button) => button.remove()
    );
    gameMode = game_Mode; // Set the game mode
    // Create a new row in the output table
    const outputTable = document.querySelector("main.output table");
    const firstRow = document.createElement("tr");
    // Insert cells in the first column of the output table
    const levelInfoCell = document.createElement("td");
    levelInfoCell.textContent = `Level 0 => 1`;
    levelInfoCell.colSpan = 2; // Span two columns
    firstRow.appendChild(levelInfoCell);
    // Append the new row to the output table
    outputTable.appendChild(firstRow);
    updateSlotBorders();
    startLevel();
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

    // Update slot borders based on currentIndex
    updateSlotBorders();
  }
}
// Function to update slot borders
function updateSlotBorders() {
  const allSlots = leftDivision.querySelectorAll(".slot");
  allSlots.forEach((slot, index) => {
    if (index === currentIndex) {
      slot.classList.add("current");
    } else {
      slot.classList.remove("current");
    }
  });
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
  lOfUncertainty,
  randomWrong,
  randomRight
) {
  const secondColumnCell = document.createElement("td");
  if (lOfUncertainty === 0) {
    secondColumnCell.textContent = `Ⓦ*${wrongs} Ⓡ*${rights}`;
  } else {
    // Handle the case where lOfUncertainty is not 0
    const rightHint = hints[randomRight];
    const wrongHint = hints[randomWrong];
    if (randomRight < randomWrong) {
      secondColumnCell.textContent = `${rightHint}*${rights} ${wrongHint}*${wrongs}`;
    } else {
      secondColumnCell.textContent = `${wrongHint}*${wrongs} ${rightHint}*${rights}`;
    }
  }
  return secondColumnCell;
}

function levelWon() {
  inputEnable = null;
  chanceRemaining += gameMode; // Increase chanceRemaining
  lOfUncertainty += 1;
  level += 1;
  // Create a new row in the output table
  const outputTable = document.querySelector("main.output table");
  const firstRow = document.createElement("tr");
  // Insert cells in the first column of the output table
  const instructionCell = document.createElement("td");
  instructionCell.textContent = `Any direction to next level`;
  instructionCell.colSpan = 2; // Span two columns
  firstRow.appendChild(instructionCell);
  // Append the new row to the output table
  outputTable.appendChild(firstRow);
  // Append direction buttons to the first 3 slots in left temp div
  const slotsInLeftTemp = leftDivision.querySelectorAll(".slot");
  for (let i = 0; i < 3; i++) {
    slotsInLeftTemp[i].innerHTML = directionButtons[i];
    const directionButton = slotsInLeftTemp[i].querySelector("button");

    // Add event listener to direction buttons
    directionButton.addEventListener("click", function () {
      // Remove all buttons from slots
      slotsInLeftTemp.forEach((slot) => {
        slot.innerHTML = ""; // Clear the content of the slot
      });

      // Insert cells in the first column of the output table
      const secondRow = document.createElement("tr");
      const levelInfoCell = document.createElement("td");
      levelInfoCell.textContent = `Level ${level - 1} => ${level}`;
      secondRow.appendChild(levelInfoCell);
      const difficultyInfoCell = document.createElement("td");
      difficultyInfoCell.textContent = `Level of Uncertainty ${
        lOfUncertainty - 1
      } => ${lOfUncertainty}`;
      secondRow.appendChild(difficultyInfoCell);

      // Append the new row to the output table
      outputTable.appendChild(secondRow);

      // Call the startLevel() function to set up the next level
      startLevel();
    });
  }
}

function startLevel() {
  inputEnable = 1;
  updateHeaderTitle();
  currentIndex = 0;
  // Generate random answer
  const minNumber = Math.pow(nOfChoices, nOfSlots);
  const maxNumber = 2 * minNumber - 1;
  const randomDecimal =
    Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
  randomAnswer = randomDecimal.toString(nOfChoices).slice(1);
  // Declare a list to store feedback: [wrongs, rights]
  feedback.length = 0; // Clear the feedback array
  // If lOfUncertainty is 1
  if (lOfUncertainty === 1) {
    // Generate a random index within the length of hints as randomRight
    randomRight = Math.floor(Math.random() * hints.length);
    // Generate another random index within the length of hints as random_wrong
    do {
      randomWrong = Math.floor(Math.random() * hints.length);
    } while (randomWrong === randomRight); // Ensure they are different
  } else if (lOfUncertainty === 0) {
    const randomRight = 1;
    const randomWrong = 0;
  }
}
function updateHeaderTitle() {
  // Update the title based on lOfUncertainty
  let titleText = "";
  for (let i = 0; i <= lOfUncertainty; i++) {
    titleText += fullName[i];
    if (i < lOfUncertainty) {
      titleText += " ";
    }
  }
  document.title = titleText; // Update the document's title
  // Load the content of the banners.txt file
  fetch("banners.txt")
    .then((response) => response.text())
    .then((data) => {
      const lines = data.split("\n");
      let selectedLines = [];

      if (lOfUncertainty === 0) {
        selectedLines = lines.slice(1, 7); // Lines 2 to 7
      } else if (lOfUncertainty === 1) {
        selectedLines = lines.slice(8, 21); // Lines 9 to 21
      } else if (lOfUncertainty === 2) {
        selectedLines = lines.slice(22, 38); // Lines 23 to 38
      }
      const header = document.querySelector(".header");
      header.innerHTML = selectedLines
        .map((line) => `<pre>${line}</pre>`)
        .join("");
    })
    .catch((error) => {
      console.error("Error fetching or parsing banners.txt:", error);
    });
}
