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
const feedback = [[], []];
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
  randomWrong;

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

      // Loop through the number buttons to find the matching button by textContent
      const numberButtons = inputContainer.querySelectorAll(".numberButton");
      for (const button of numberButtons) {
        if (button.textContent === String(number)) {
          // Trigger the click event on the corresponding number button
          if (event.target === document.body) {
            button.click();
          }
          break; // Exit the loop once the button is found
        }
      }
    } else if (keyCode === 188 || keyCode === 54 || keyCode === 190) {
      // Comma (<), Caret (^), or Period (>)
      // Find the direction button with the corresponding value in leftDivision
      const directionButton = leftDivision.querySelector(
        `.numberButton[value="${keyCode}"]`
      );

      // Trigger the click event on the direction button
      if (directionButton && event.target === document.body) {
        directionButton.click();
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
  // Add all number buttons to the inputContainer
  inputContainer.innerHTML = numberButtons.join("");

  // Function to handle button clicks in inputContainer
  function handleInputButtonClick(event) {
    const clickedButton = event.target;
    const buttonContent = parseInt(clickedButton.textContent);
    if (buttonContent === 3 || buttonContent === 7) {
      selectGameMode(buttonContent);
    }
  }
  // Attach click event listeners to the buttons in inputContainer
  const inputButtons = inputContainer.querySelectorAll("button");
  inputButtons.forEach((button) => {
    button.addEventListener("click", handleInputButtonClick);
  });

  // Create the Enter button
  enterButton.textContent = "Remaining chance(s)";
  rightDivision.appendChild(enterButton);

  // Event listener for the Enter button
  enterButton.addEventListener("click", function () {
    if (gameMode) {
      const slotsFilled = Array.from(
        leftDivision.querySelectorAll(".slot")
      ).every((slot) => slot.children.length > 0);

      if (slotsFilled) {
        chanceRemaining--;
        // Create a new row in the output table
        const newRow = document.createElement("tr");

        // Get the values of buttons in the slots as the guess
        const buttonsInSlots = Array.from(
          leftDivision.querySelectorAll(".slot button")
        );
        const guess = buttonsInSlots.map((button) => button.textContent);
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
        // Call the turnCount function with randomAnswer and guess
        const [wrongs, rights] = turnCount(randomAnswer, guess);
        feedback.push([wrongs, rights]);
        // Append the guess to the first column
        const firstColumnCell = document.createElement("td");
        firstColumnCell.textContent = buttonsInSlots
          .map((button) => button.value)
          .join("");
        newRow.appendChild(firstColumnCell);

        // Generate randomRight and randomWrong based on l_Uncertainty
        if (l_Uncertainty === 2) {
          randomRight = Math.floor(Math.random() * hints.length);
          do {
            randomWrong = Math.floor(Math.random() * hints.length);
          } while (randomWrong === randomRight);
        }
        if (rights === n_Slots) {
          const endTime = performance.now();
          const elapsedTimeInMilliseconds = endTime - startTime;
          elapsedTimeList.push(elapsedTimeInMilliseconds);
          const secondColumnCell = document.createElement("td");
          secondColumnCell.innerHTML = `Answer correct<br />(Time used: ${(
            elapsedTimeInMilliseconds / 1000
          ).toFixed(3)} seconds)`;
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
          // Append the new row to the output table
          outputTable.appendChild(newRow);
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
      // Update slot borders based on currentIndex
      updateSlotBorders();
    }
  });
  // Function for Game mode buttons
  function selectGameMode(game_Mode) {
    level = 2;
    chanceRemaining = 16;
    n_Slots = 4;
    n_Choices = 6;
    l_Uncertainty = 0;

    enterButton.textContent = `Remaining`;
    enterButton.insertAdjacentHTML("beforeend", "<br>");
    enterButton.insertAdjacentText("beforeend", `${chanceRemaining} chance(s)`);

    // Remove buttons from slots
    Array.from(leftDivision.querySelectorAll(".slot button")).forEach(
      (button) => button.remove()
    );
    gameMode = game_Mode; // Set the game mode
    // Create a new row in the output table
    const firstRow = document.createElement("tr");
    // Insert cells in the first column of the output table
    const levelInfoCell = document.createElement("td");
    levelInfoCell.textContent = `Level ${level - 1} => ${level}`;
    firstRow.appendChild(levelInfoCell);
    const emptyCell = document.createElement("td");
    firstRow.appendChild(emptyCell);
    // Append the new row to the output table
    outputTable.appendChild(firstRow);
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

    // Update slot borders based on currentIndex
    updateSlotBorders();
  }
}
function updateHeaderTitle() {
  // Update the title based on l_Uncertainty
  let titleText = "";
  for (let i = 0; i <= l_Uncertainty; i++) {
    titleText += fullName[i];
    if (i < l_Uncertainty) {
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
}
// Function to update slot borders
function updateSlotBorders() {
  leftDivision.querySelectorAll(".slot").forEach((slot, index) => {
    slot.classList.toggle("current", index === currentIndex);
  });
}

function levelStart() {
  startTime = performance.now(); // Store the current time
  elapsedTimeList = []; // Clear the elapsed time list
  inputEnable = 1;
  updateHeaderTitle();
  // Create the slots dynamically based on n_Slots
  leftDivision.innerHTML = "";
  for (let i = 1; i <= n_Slots; i++) {
    const slotElement = document.createElement("div");
    slotElement.classList.add("slot");
    slotElement.id = `slot${i}`;
    leftDivision.appendChild(slotElement);
  }
  currentIndex = 0;
  updateSlotBorders();
  // Add the number buttons to the inputContainer
  inputContainer.innerHTML = numberButtons.slice(0, n_Choices).join("");
  // Function to handle button clicks in inputContainer
  function handleInputButtonClick(event) {
    const clickedButton = event.target;
    if (inputEnable) {
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
      currentIndex = (currentIndex + 1) % n_Slots;
      // Update slot borders based on currentIndex
      updateSlotBorders();
    }
  }
  // Attach click event listeners to the buttons in inputContainer
  const inputButtons = inputContainer.querySelectorAll("button");
  inputButtons.forEach((button) => {
    button.addEventListener("click", handleInputButtonClick);
  });

  // Generate random answer
  const minNumber = Math.pow(n_Choices, n_Slots);
  const maxNumber = 2 * minNumber - 1;
  const randomDecimal =
    Math.floor(Math.random() * (maxNumber - minNumber + 1)) + minNumber;
  randomAnswer = randomDecimal.toString(n_Choices).slice(1);
  // Declare a list to store feedback: [wrongs, rights]
  feedback.length = 0; // Clear the feedback array
  // If l_Uncertainty is 1
  if (l_Uncertainty === 1) {
    // Generate a random index within the length of hints as randomRight
    randomRight = Math.floor(Math.random() * hints.length);
    // Generate another random index within the length of hints as random_wrong
    do {
      randomWrong = Math.floor(Math.random() * hints.length);
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
    secondColumnCell.innerHTML = `Ⓦ*${wrongs} <span class="rightHint">Ⓡ</span>*${rights}`;
  } else {
    // Handle the case where l_Uncertainty is not 0
    const rightHint = hints[randomRight];
    const wrongHint = hints[randomWrong];
    if (randomRight < randomWrong) {
      secondColumnCell.innerHTML = `<span>${rightHint}</span>*${rights} ${wrongHint}*${wrongs}`;
    } else {
      secondColumnCell.innerHTML = `${wrongHint}*${wrongs} <span>${rightHint}</span>*${rights}`;
    }
  }
  return secondColumnCell;
}
function levelWon() {
  inputEnable = null; // Disable number buttons in input section

  // Select all <span> elements within the output table rows
  const spanElements = outputTable.querySelectorAll("tr span");
  // Loop through the <span> elements and add the rightHint class
  spanElements.forEach((spanElement) => {
    spanElement.classList.add("rightHint");
  });

  // Append direction buttons to the first 3 slots in left temp div
  const slotsInLeftTemp = leftDivision.querySelectorAll(".slot");
  for (let i = 0; i < 3; i++) {
    slotsInLeftTemp[i].innerHTML = directionButtons[i];
  }
  if (level === gameMode) {
    gameEnd(1);
  } else {
    if (gameMode === 3) {
      // Create a new row in the output table for the instruction
      const instructionRow = document.createElement("tr");
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
      rowsToAdd = [
        ["<", "number of choices +=2 (max 10)"],
        ["^", "level of uncertainty +=1 (max 2)"],
        [">", "number of slot +=1 (max 6)"],
      ];
      rowsToAdd.forEach((rowContent) => {
        const newRow = document.createElement("tr");
        rowContent.forEach((cellContent) => {
          const cell = document.createElement("td");
          cell.innerHTML = cellContent;
          newRow.appendChild(cell);
        });
        outputTable.appendChild(newRow);
      });
    }

    // Append direction buttons to the first 3 slots in left temp div
    const slotsInLeftTemp = leftDivision.querySelectorAll(".slot");
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
          level++;
          // Insert cells in the first column of the output table for level info
          const firstRow = document.createElement("tr");
          const levelInfoCell = document.createElement("td");
          levelInfoCell.textContent = `Level ${level - 1} => ${level}`;
          firstRow.appendChild(levelInfoCell);
          firstRow.appendChild(difficultyInfoCell);
          // Append the new row to the output table
          outputTable.appendChild(firstRow);
          // Call the levelStart() function to set up the next level
          levelStart();
        }
      });
    }
  }
}

function gameEnd(ifWin) {
  // Add additional rows
  let rowsToAdd;
  if (ifWin) {
    // Calculate the sum of elapsed times
    const sumElapsedTime =
      elapsedTimeList.reduce((sum, elapsedTime) => sum + elapsedTime, 0) / 1000; // Convert to seconds
    rowsToAdd = [
      [
        `Congratulations!<br/>You completed ${gameMode} levels`,
        `Chance(s) remaining: ${chanceRemaining}<br/>Time used: ${sumElapsedTime.toFixed(
          3
        )} seconds`,
      ],
    ];
  } else {
    // Select all <span> elements within the output table rows
    const spanElements = outputTable.querySelectorAll("tr span");

    // Loop through the <span> elements and add the rightHint class
    spanElements.forEach((spanElement) => {
      spanElement.classList.add("rightHint");
    });
    rowsToAdd = [["You lose!", `at ${level} out of ${gameMode} levels`]];
    // Append direction buttons to the first 3 slots in left temp div
    const slotsInLeftTemp = leftDivision.querySelectorAll(".slot");
    for (let i = 0; i < 3; i++) {
      slotsInLeftTemp[i].innerHTML = directionButtons[i];
    }
  }
  rowsToAdd.push(
    ["<(fake)", "share to social media"],
    ["^(fake)", "view personal statistics"],
    [">(fake)", "view population statistics"],
    ["③", "3 levels; or,"],
    ["⑦", "2 mandatory levels +<br />5 out of 25 choosable levels"]
  );
  rowsToAdd.forEach((rowContent) => {
    const newRow = document.createElement("tr");
    rowContent.forEach((cellContent) => {
      const cell = document.createElement("td");
      cell.innerHTML = cellContent;
      newRow.appendChild(cell);
    });
    outputTable.appendChild(newRow);
  });
  gameMode = null;
}
