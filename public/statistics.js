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
const canvas = document.getElementById("pictogramChart");
// Disable checkboxes if userIP is null
if (userIP === null) {
  gamesIfUserCheckbox.disabled = true;
  levelsIfUserCheckbox.disabled = true;
}
// Initialize the queries, counts, and unique IP tracking
const queries = getPopulationQueries(); // Define an array of queries
const realTimeCounts = new Array(queries.length).fill(0); // Define an array to store real-time counts
const uniqueIPs = new Set(); // Use a Set to store unique IP addresses
attachQueryListeners(queries, realTimeCounts, uniqueIPs); // Attach the onSnapshot listeners for real-time updates
let querySnapshot;
const symbolImage = new Image(); // Cache the image outside to avoid reloading it each time
symbolImage.src = "./dot.png"; // Replace with your actual image path
let currentXPositionArray = []; // Store X positions
let resultArrayGlobal = []; // Store resultArray globally
let spacingBtwResultScores; // Spacing between result scores
// symbolImage.onload = () => {
//   console.log("Symbol image loaded");
// };// Ensure the image is loaded once

const queryGamesButton = document.getElementById("queryGames");
queryGamesButton.addEventListener("click", async function () {
  const resultArray = await queryGames(); // Await the result of the async function
  if (resultArray) {
    // Check if resultArray is not null
    drawPictogram(resultArray); // Call the pictogram drawing function
  }
});
queryGamesButton.click();
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
    querySnapshot = await getDocs(gameQuery); // Execute the query
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
    const resultArray = Object.entries(scoreCounts).map(([score, count]) => ({
      resultScore: parseInt(score),
      count: count,
    })); // Convert the scoreCounts object to an array of resultScore-count pairs
    resultArray.sort((a, b) => a.resultScore - b.resultScore); // Sort the resultArray by resultScore in ascending order
    console.log(resultArray); // Return or process the sorted array
    return resultArray; // Return the sorted array with counts
  } catch (error) {
    console.error("Error querying documents: ", error);
  }
}
async function drawPictogram(resultArray) {
  const ctx = canvas.getContext("2d");
  const totalGames = resultArray.reduce((acc, item) => acc + item.count, 0);
  const chartWidth = canvas.width - 50;
  const chartHeight = canvas.height - 30;
  const symbolSize = Math.min(chartWidth / (resultArray.length * 5), 20);
  const maxSymbolCount = Math.floor(chartHeight / symbolSize);
  const baseX = 50;
  const baseY = canvas.height - 30;
  const axisPadding = 10;
  const ctxFontSize = 12;
  const gamesPerSymbol = Math.ceil(
    totalGames / (resultArray.length * maxSymbolCount)
  );
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas and set text style
  ctx.fillStyle = "white";
  ctx.beginPath(); // Draw X-axis
  ctx.moveTo(baseX - axisPadding, baseY);
  ctx.lineTo(baseX + chartWidth, baseY);
  ctx.strokeStyle = "white";
  ctx.stroke();
  ctx.font = `${ctxFontSize}px Monaco`;
  ctx.fillText("Result", 0, baseY + axisPadding);
  ctx.fillText("Score", 0, baseY + axisPadding + ctxFontSize);
  ctx.save(); // Draw the legend (Key)
  ctx.translate(15, (canvas.height * 2) / 3);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `${ctxFontSize}px Arial`;
  ctx.fillText(`Each bead represents ${gamesPerSymbol} game(s)`, 0, 0);
  ctx.restore();
  const totalColumns = resultArray.reduce(
    (acc, item) => acc + Math.ceil(item.count / maxSymbolCount),
    0
  );
  const spacingBtwColumns = symbolSize * 0.75;
  const totalColumnWidth = totalColumns * spacingBtwColumns;
  const remainingWidth = chartWidth - totalColumnWidth;
  spacingBtwResultScores = (remainingWidth - 10) / (resultArray.length - 1);
  let currentXPosition = baseX;
  currentXPositionArray = []; // Reset X positions
  resultArrayGlobal = resultArray; // Store resultArray globally
  resultArray.forEach((item) => {
    const resultScore = item.resultScore;
    const count = item.count;
    const numColumns = Math.ceil(count / maxSymbolCount);
    const symbolsPerColumn = Math.min(count, maxSymbolCount);
    ctx.fillText(
      resultScore,
      currentXPosition + (numColumns * spacingBtwColumns) / 2 - symbolSize / 2,
      baseY + axisPadding * 2
    ); // Draw the result score label
    currentXPositionArray.push(currentXPosition); // Store the X position
    // Draw symbols for each result score
    for (let col = 0; col < numColumns; col++) {
      const xPosition = currentXPosition + col * spacingBtwColumns;
      const symbolsInCurrentColumn = Math.min(
        symbolsPerColumn,
        count - col * maxSymbolCount
      );
      for (let i = 0; i < symbolsInCurrentColumn; i++) {
        const yPosition = baseY - (i + 1) * symbolSize;
        ctx.drawImage(
          symbolImage,
          xPosition,
          yPosition,
          symbolSize,
          symbolSize
        );
      }
    }
    currentXPosition += numColumns * spacingBtwColumns + spacingBtwResultScores;
  });
  canvas.removeEventListener("click", handleClickOnCanvas); // Remove old listener
  canvas.addEventListener("click", handleClickOnCanvas); // Attach new one
}
function handleClickOnCanvas(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = (event.clientX - rect.left) * scaleX;
  // Check if the click falls within a column
  resultArrayGlobal.forEach((item, index) => {
    const columnStartX =
      currentXPositionArray[index] - spacingBtwResultScores / 3;
    const columnEndX =
      currentXPositionArray[index + 1] !== undefined
        ? currentXPositionArray[index + 1] - spacingBtwResultScores * (2 / 3)
        : canvas.width; // If it's the last one, end is canvas width
    if (mouseX >= columnStartX && mouseX <= columnEndX) {
      createRankingBoard(item.resultScore);
    }
  });
}

// const rankingBoardContainer = document.getElementById("rankingBoard");
async function createRankingBoard(resultScoreFilter) {
  try {
    let filteredResults = []; // Array to store filtered results
    // Filter and collect relevant documents
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Adjust based on the resultScoreFilter
      if (data.resultScore === resultScoreFilter) {
        filteredResults.push({
          resultScore: data.resultScore,
          secondsPerLevel: data.secondsPerLevel, // This might be undefined if resultScoreFilter < 0
          ipAddress: data.ipAddress, // Added IP address and dateTime for table
          dateTime: data.dateTime,
        });
      }
    });
    // Sort the results only if secondsPerLevel is available (resultScoreFilter >= 0)
    if (resultScoreFilter >= 0) {
      filteredResults.sort((a, b) => a.secondsPerLevel - b.secondsPerLevel); // Sort by secondsPerLevel if applicable
    }
    // const topResults = filteredResults.slice(0, 9); // Only display top 9 entries
    rankingBoardContainer.innerHTML = ""; // Clear previous entries
    const table = document.createElement("table"); // Create a table element
    table.classList.add("ranking-table");
    let headerRow = `<thead><tr>
          <th>Rank</th>
          <th>User Name</th>
          <th>Date Time</th>`; // Define the table headers
    // Add "Seconds per levels" column if resultScoreFilter >= 0
    if (resultScoreFilter >= 0) {
      headerRow += `<th>Seconds per Levels</th>`;
    }
    headerRow += `</tr></thead>`;
    table.innerHTML = headerRow; // Add the header row to the table
    const tableBody = document.createElement("tbody"); // Create the body of the table
    topResults.forEach((result, index) => {
      let row = `
        <tr>
          <td>${index + 1}</td>
          <td>${result.ipAddress}</td>
          <td>${result.dateTime}</td>
      `; // Populate the table with top 9 results
      // Conditionally display secondsPerLevel if available
      if (resultScoreFilter >= 0) {
        row += `<td>${result.secondsPerLevel || "N/A"}</td>`;
      }
      row += `</tr>`;
      tableBody.innerHTML += row; // Add each row to the table body
    });
    table.appendChild(tableBody); // Append the table body to the table
    console.log(table);
    // rankingBoardContainer.appendChild(table); // Append the table to the ranking board container
  } catch (error) {
    console.error("Error creating ranking board:", error);
  }
}
