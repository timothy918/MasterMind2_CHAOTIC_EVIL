import {
  getDocs,
  query,
  where,
  Timestamp,
  // getCountFromServer,
  onSnapshot, // Import onSnapshot for real-time updates
  // serverTimestamp,
  // addDoc,
  // deleteDoc,
  // limit,
  // FieldValue,
  // doc,
  // updateDoc,
  // deleteField,
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { colRef, getCookie, db, timeframes } from "./index.js";

const populationTable = document.getElementById("population");
let userIP = getCookie("MasterMind2userIP"); // Try to get the player's IP address and create personalized queries
const gamesIfUserCheckbox = document.getElementById("gamesIfUser"); // Get checkbox elements
const levelsIfUserCheckbox = document.getElementById("levelsIfUser"); // Get checkbox elements
// Disable checkboxes if userIP is null
if (userIP === null) {
  gamesIfUserCheckbox.disabled = true;
  levelsIfUserCheckbox.disabled = true;
}

function getPopulationQueries() {
  const baseQueries = [
    query(colRef, where("gameMode", "==", 3)), // GameMode 3
    query(colRef, where("gameMode", "==", 7)), // GameMode 7
  ];
  try {
    const personalizedQueries = [
      query(baseQueries[0], where("ipAddress", "==", userIP)), // Personal Real GameMode 3
      query(baseQueries[1], where("ipAddress", "==", userIP)), // Personal Real GameMode 7
    ];
    return [...baseQueries, ...personalizedQueries]; // Return both base and personalized queries
  } catch (error) {
    console.log("User's IP address not found");
    return baseQueries; // Return only base queries if no user IP
  }
}

// Function to attach onSnapshot listeners
function attachQueryListeners(queries, realTimeCounts, uniqueIPs) {
  queries.forEach((query, index) => {
    const unsubscribe = onSnapshot(query, (snapshot) => {
      realTimeCounts[index] = snapshot.size;
      // Update unique IPs based on document changes
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (data.ipAddress) {
          if (change.type === "added") {
            uniqueIPs.add(data.ipAddress);
          } else if (change.type === "removed") {
            uniqueIPs.delete(data.ipAddress);
          }
        }
      });
      updatePopulationDisplay(realTimeCounts); // Call both update functions
      updateUniqueIPDisplay(uniqueIPs);
    });
    // You can store the unsubscribe function if you need it later
  });
}

// Function to update the display for the unique IP count
function updateUniqueIPDisplay(uniqueIPs) {
  let countPlayers = uniqueIPs.size;
  if (userIP) {
    countPlayers -= 1; // Exclude the user's own IP from the count if necessary
  }
  const headerRow = populationTable.rows[0];
  headerRow.cells[2].textContent = `${countPlayers} `;
  headerRow.cells[2].insertAdjacentHTML("beforeend", "<br>"); // Insert the line break as HTML
  headerRow.cells[2].insertAdjacentText("beforeend", `others`);
}

// Initialize the queries, counts, and unique IP tracking
const queries = getPopulationQueries(); // Define an array of queries
const realTimeCounts = new Array(queries.length).fill(0); // Define an array to store real-time counts
const uniqueIPs = new Set(); // Use a Set to store unique IP addresses
attachQueryListeners(queries, realTimeCounts, uniqueIPs); // Attach the onSnapshot listeners for real-time updates

// Function to update the table display
function updatePopulationDisplay(realTimeCounts) {
  const gameMode3Row = populationTable.rows[1]; // Row for GameMode 3
  gameMode3Row.cells[3].textContent = realTimeCounts[0]; // Total count
  const gameMode7Row = populationTable.rows[2]; // Row for GameMode 7
  gameMode7Row.cells[3].textContent = realTimeCounts[1]; // Total count
  if (userIP) {
    gameMode3Row.cells[1].textContent = realTimeCounts[2]; // "yours" real count
    gameMode3Row.cells[2].textContent = realTimeCounts[0] - realTimeCounts[2]; // others = real- yours count
    gameMode7Row.cells[1].textContent = realTimeCounts[3]; // "yours" real count
    gameMode7Row.cells[2].textContent = realTimeCounts[1] - realTimeCounts[3]; // others = real- yours count
  } else {
    gameMode3Row.cells[1].textContent = "NaN"; // "yours" real count
    gameMode3Row.cells[2].textContent = realTimeCounts[0]; // others = real
    gameMode7Row.cells[1].textContent = "NaN"; // "yours" real count
    gameMode7Row.cells[2].textContent = realTimeCounts[1]; // others = real
  }
}

document
  .getElementById("queryGames")
  .addEventListener("click", async function () {
    const resultArray = await queryGames(); // Await the result of the async function
    if (resultArray) {
      // Check if resultArray is not null
      drawPictogram(resultArray); // Call the pictogram drawing function
    }
  });

// Function to query Firestore based on the form inputs and return a count by resultScore
async function queryGames() {
  // Get form inputs
  const mode = document.getElementById("mode").value; // Game mode (3 or 7)
  const timeRange = document.getElementById("time").value; // Time range (e.g., "daily")
  const isUserOnly = gamesIfUserCheckbox.checked; // Checkbox for user records only
  const selectedTimeframe = timeframes.find(
    (frame) => frame.label === timeRange
  );
  const duration = selectedTimeframe.duration; // Get the duration from the selected time range
  const [baseQuery3, baseQuery7] = queries; // Get the existing queries for gameMode 3 and 7
  let gameQuery; // Initialize gameQuery based on mode and user input
  if (mode == 3) {
    gameQuery = isUserOnly && queries[2] ? queries[2] : baseQuery3; // Use personalizedQuery3 if exists
  } else {
    gameQuery = isUserOnly && queries[3] ? queries[3] : baseQuery7; // Use personalizedQuery7 if exists
  }
  // Add a time filter if the selected time is not "all time"
  if (duration !== Infinity) {
    const now = Timestamp.now(); // Get the current timestamp (Firestore Timestamp)
    const cutoffTimestamp = new Timestamp(now.seconds - duration, 0); // Calculate the cutoff timestamp
    gameQuery = query(gameQuery, where("dateTime", ">=", cutoffTimestamp));
  }
  try {
    const querySnapshot = await getDocs(gameQuery); // Execute the query
    const scoreCounts = {}; // Object to hold counts of each resultScore
    // Iterate through each document
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Check if resultScore exists and count it
      if (data.resultScore !== undefined) {
        scoreCounts[data.resultScore] =
          (scoreCounts[data.resultScore] || 0) + 1; // Increment the count for this resultScore
      }
    });
    // Convert the scoreCounts object to an array of resultScore-count pairs
    const resultArray = Object.entries(scoreCounts).map(([score, count]) => ({
      resultScore: parseInt(score),
      count: count,
    }));
    resultArray.sort((a, b) => a.resultScore - b.resultScore); // Sort the resultArray by resultScore in ascending order
    console.log(resultArray); // Return or process the sorted array
    return resultArray; // Return the sorted array with counts
  } catch (error) {
    console.error("Error querying documents: ", error);
  }
}
async function drawPictogram(resultArray) {
  const canvas = document.getElementById("pictogramChart");
  const ctx = canvas.getContext("2d");
  const symbolImage = new Image(); // Load the PNG image
  symbolImage.src = "./dot.png"; // Replace with your actual image path
  const totalGames = resultArray.reduce((acc, item) => acc + item.count, 0); // Calculate the total number of games

  symbolImage.onload = () => {
    const chartWidth = canvas.width - 50; // Available width after axis padding
    const chartHeight = canvas.height - 50; // Available height after axis padding
    const symbolSize = Math.min(chartWidth / (resultArray.length * 5), 20); // Set image size dynamically
    const symbolHeight = symbolSize * 2; // Height of each symbol including spacing
    const maxSymbolCount = Math.floor(chartHeight / symbolHeight); // Max number of symbols vertically
    const baseX = 50; // Starting X position for the X-axis and chart
    const baseY = canvas.height - 30; // Starting Y position (bottom of the canvas)
    const axisPadding = 10; // Padding for axes
    const ctxFontSize = 14;

    const gamesPerSymbol = Math.ceil(
      totalGames / (resultArray.length * maxSymbolCount)
    ); // Calculate gamesPerSymbol dynamically based on total games and available space
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.fillStyle = "white"; // Set text color
    ctx.beginPath(); // Draw X-axis (horizontal line)
    ctx.moveTo(baseX - axisPadding, baseY);
    ctx.lineTo(baseX + chartWidth, baseY);
    ctx.strokeStyle = "white"; // Color of the axis
    ctx.stroke();

    // Add the "Result Score" label to the Y-axis (left-hand side of the X-axis)
    ctx.font = `${ctxFontSize}px Arial`; // Set font size and style for the label
    ctx.fillText("Result", 0, baseY + axisPadding); // First line of the label
    ctx.fillText("Score", 0, baseY + axisPadding + ctxFontSize); // Second line of the label (15 pixels down)

    // Draw the key (legend) for how many games each symbol represents
    ctx.save(); // Save the current state of the canvas
    ctx.translate(30, canvas.height / 2); // Move the origin point for the key
    ctx.rotate(-Math.PI / 2); // Rotate the canvas 90 degrees counterclockwise
    ctx.font = `${ctxFontSize}px Arial`; // Set font size for the key
    ctx.fillText(
      `Each dot represents ${gamesPerSymbol} game(s)`,
      baseY - canvas.height,
      0
    ); // Draw key text
    ctx.restore(); // Restore the canvas to its previous state

    const totalColumns = resultArray.reduce((acc, item) => {
      return acc + Math.ceil(item.count / maxSymbolCount);
    }, 0); // Calculate total number of columns required

    // Calculate spacing between different resultScores
    const totalColumnWidth = totalColumns * symbolSize; // Total width occupied by all columns
    const remainingWidth = chartWidth - totalColumnWidth; // Space left for spacing between resultScores
    const spacingBetweenResultScores =
      remainingWidth / (resultArray.length - 1); // Divide the remaining width by the number of gaps between resultScores
    let currentXPosition = baseX; // Running counter to track the X position of the last drawn column

    // Define spacing between columns within the same resultScore
    const spacingBetweenColumns = symbolSize * 0.75; // Spacing between columns of the same resultScore

    // Loop over the resultArray and draw the images for each value
    resultArray.forEach((item) => {
      const resultScore = item.resultScore;
      const count = item.count;
      const numColumns = Math.ceil(count / maxSymbolCount); // Calculate the number of columns needed if the count exceeds maxSymbolCount
      const symbolsPerColumn = Math.min(count, maxSymbolCount); // Limit symbols per column

      // Draw the resultScore label below the X-axis
      ctx.fillText(
        resultScore,
        currentXPosition +
          (numColumns * spacingBetweenColumns) / 2 -
          symbolSize / 2,
        baseY + axisPadding * 2
      );

      // Draw multiple columns of symbol images, starting from currentXPosition
      for (let col = 0; col < numColumns; col++) {
        const xPosition = currentXPosition + col * spacingBetweenColumns; // Adjust the X position for each column within the same resultScore

        const symbolsInCurrentColumn = Math.min(
          symbolsPerColumn,
          count - col * maxSymbolCount
        ); // Determine how many symbols to draw in the current column

        // Draw the symbols, stacking them vertically in each column
        for (let i = 0; i < symbolsInCurrentColumn; i++) {
          const yPosition = baseY - (i + 1) * symbolHeight; // Calculate Y position for each image
          ctx.drawImage(
            symbolImage,
            xPosition,
            yPosition,
            symbolSize,
            symbolSize
          ); // Draw the image
        }
      }

      // Update currentXPosition by adding the width of the columns within the resultScore plus the calculated spacing between resultScores
      currentXPosition +=
        numColumns * spacingBetweenColumns + spacingBetweenResultScores;
    });
  };
}
