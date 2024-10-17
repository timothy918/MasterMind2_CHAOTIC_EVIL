import {
  getDocs,
  query,
  where,
  Timestamp,
  onSnapshot, // Import onSnapshot for real-time updates
  // writeBatch,
} from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { colRef, getCookie, db, timeframes } from "./index.js";

const populationTable = document.getElementById("population");
let userIP = getCookie("MasterMind2userIP"); // Try to get the player's IP address and create personalized queries
const gamesIfUserCheckbox = document.getElementById("gamesIfUser"); // Get checkbox elements
const levelsIfUserCheckbox = document.getElementById("levelsIfUser"); // Get checkbox elements
const canvas = document.getElementById("pictogramChart");
const ctx = canvas.getContext("2d");
if (userIP === "Anonymous") {
  gamesIfUserCheckbox.disabled = true; // Disable checkboxes if userIP is null
  levelsIfUserCheckbox.disabled = true;
}
// Initialize the queries, counts, and unique IP tracking
const uniqueIPs = new Set(); // Use a Set to store unique IP addresses
const queryGamesButton = document.getElementById("queryGames");
getPopulationData(); // Define an array of queries
let querySnapshot,
  spacingBtwResultScores, // Spacing between result scores
  publicMode,
  publicTimeRange,
  publiceIsUserOnly;
const symbolImage = new Image(); // Cache the image outside to avoid reloading it each time
symbolImage.src = "./dot.png"; // Replace with your actual image path
let currentXPositionArray = []; // Store X positions
let resultArrayGlobal = []; // Store resultArray globally

async function getPopulationData() {
  const combinedQuery = query(colRef, where("gameMode", "in", [3, 7])); // Define the combined query for gameMode 3 and 7
  try {
    querySnapshot = await getDocs(combinedQuery); // Fetch documents from combinedQuery once
    // Initialize counts: one for each gameMode 3 and 7, plus personalized counts if userIP exists
    let realTimeCounts = [0, 0]; // For gameMode 3 and gameMode 7
    if (userIP !== "Anonymous") {
      realTimeCounts.push(0, 0); // Extra counts for personalized queries
    }
    // Loop through all documents once
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Update general counts for gameMode 3 and 7
      if (data.gameMode === 3) {
        realTimeCounts[0]++;
        if (data.ipAddress === userIP) {
          realTimeCounts[2]++; // Personal GameMode 3
        }
      } else if (data.gameMode === 7) {
        realTimeCounts[1]++;
        if (data.ipAddress === userIP) {
          realTimeCounts[3]++; // Personal GameMode 7
        }
      }
      if (data.ipAddress) {
        uniqueIPs.add(data.ipAddress); // Track unique IPs
      }
    });
    updatePopulationDisplay(realTimeCounts); // Update the UI based on the results
    updateUniqueIPDisplay(uniqueIPs);
    queryGamesButton.addEventListener("click", async function () {
      const resultArray = await queryGames(); // Await the result of the async function
      if (resultArray) {
        // Check if resultArray is not null
        drawPictogram(resultArray); // Call the pictogram drawing function
      }
    });
    // queryGamesButton.click();
  } catch (error) {
    console.error("Error fetching population data:", error);
    return; // Return null in case of error
  }
}
// Function to update the display for the unique IP count
function updateUniqueIPDisplay(uniqueIPs) {
  let countPlayers = uniqueIPs.size;
  if (userIP !== "Anonymous") {
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
  if (userIP !== "Anonymous") {
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
  const totalRow = populationTable.rows[3];
  totalRow.cells[1].textContent =
    Number(gameMode3Row.cells[1].textContent) +
    Number(gameMode7Row.cells[1].textContent);
  totalRow.cells[2].textContent =
    Number(gameMode3Row.cells[2].textContent) +
    Number(gameMode7Row.cells[2].textContent);
  totalRow.cells[3].textContent =
    Number(gameMode3Row.cells[3].textContent) +
    Number(gameMode7Row.cells[3].textContent);
}
function queryGames() {
  publicMode = document.getElementById("mode").value; // Game mode (3 or 7)
  publicTimeRange = document.getElementById("time").value; // Time range (e.g., "daily")
  publiceIsUserOnly = gamesIfUserCheckbox.checked; // Checkbox for user records only
  const selectedTimeframe = timeframes.find(
    (frame) => frame.label === publicTimeRange
  );
  const duration = selectedTimeframe.duration; // Get the duration from the selected time range
  // Get the documents from the public variable querySnapshot instead of calling getDocs again
  if (!querySnapshot || querySnapshot.empty) {
    console.error("No documents available in querySnapshot.");
    // Clear the canvas before drawing the error message
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas area
    ctx.font = "20px Arial"; // Set the font size and type
    ctx.fillStyle = "red"; // Set the text color
    // Display the error message on the canvas
    ctx.fillText("No data available to display", 10, 50); // Draw the text at coordinates (10, 50)
    return; // Ensure querySnapshot is available
  }
  const now = Timestamp.now(); // Initialize result filtering
  const cutoffTimestamp =
    duration !== Infinity ? new Timestamp(now.seconds - duration, 0) : null;
  const scoreCounts = {}; // Initialize the scoreCounts object
  // Filter the querySnapshot data
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Apply the filters based on the form inputs
    if (
      data.gameMode == publicMode && // Filter by selected game mode
      (!publiceIsUserOnly || data.ipAddress === userIP) && // Filter by user IP if needed
      (!cutoffTimestamp || data.dateTime >= cutoffTimestamp) // Filter by selected time range
    ) {
      // Count the resultScore
      if (data.resultScore !== undefined) {
        scoreCounts[data.resultScore] =
          (scoreCounts[data.resultScore] || 0) + 1; // Increment count
      }
    }
  });
  // Convert scoreCounts object to an array of resultScore-count pairs
  const resultArray = Object.entries(scoreCounts).map(([score, count]) => ({
    resultScore: parseInt(score),
    count: count,
  }));
  resultArray.sort((a, b) => a.resultScore - b.resultScore); // Sort the resultArray by resultScore in ascending order
  console.log(resultArray); // Return or process the sorted array
  return resultArray; // Return the sorted array with counts
}

async function drawPictogram(resultArray) {
  if (scatterChart) scatterChart.destroy(); // Destroy any existing chart instance before creating a new one
  canvas.width = 500; // Set your desired width
  canvas.height = 400; // Set your desired height
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
      drawScatterPlot(item.resultScore);
    }
  });
}
let scatterChart = null; // Global variable to store the chart instance
async function drawScatterPlot(resultScoreFilter) {
  // Collect and filter relevant documents based on the resultScoreFilter
  const filteredResults = querySnapshot.docs
    .map((doc) => doc.data())
    .filter(
      (data) =>
        data.resultScore === resultScoreFilter && data.gameMode == publicMode
    ) // Add the filter for gameMode
    .map((data) => ({
      resultScore: data.resultScore,
      secondsPerLevel: data.secondsPerLevel || 1, // Avoid ln(0) by defaulting to 1
      ipAddress: data.ipAddress,
      dateTime: data.dateTime ? data.dateTime.toDate() : new Date(), // Convert Firestore timestamp to Date object
    }));
  // Create data for the scatter plot by applying ln(secondsPerLevel)
  const scatterData = filteredResults.map((result) => ({
    x: result.dateTime, // Use dateTime as the x-axis value
    y: Math.log(result.secondsPerLevel), // Apply ln transformation to secondsPerLevel
    label: result.ipAddress,
    roundedSeconds: Math.round(result.secondsPerLevel * 100) / 100,
  }));
  // Create a new scatter chart
  scatterChart = new Chart(ctx, {
    type: "scatter", // Scatter chart type
    data: {
      datasets: [
        {
          label: `Result Score = ${resultScoreFilter}`,
          data: scatterData,
          borderColor: "rgba(54, 162, 235, 1)",
          pointRadius: 5,
          pointHoverRadius: 7,
          showLine: false, // No line between points
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day", // Group data points by day
            tooltipFormat: "MMM D, YYYY h:mm a", // Format tooltip as 'Month Day, Year Hour:Minute AM/PM'
            displayFormats: {
              day: "MMM D", // Format X-axis ticks as 'Month Day'
            },
          },
          title: {
            display: true,
            text: "Date",
          },
          max: new Date(), // Set the max range of x-axis to today
        },
        y: {
          position: "right", // Move Y-axis to the right
          ticks: {
            callback: function (value) {
              return Math.round(Math.exp(value)); // Reverse ln transformation for Y-axis labels
            },
          },
          title: {
            display: true,
            text: "Seconds per level",
          },
          reverse: true, // Reverse Y-axis to have lower values at the top
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const dataPoint = scatterData[context.dataIndex];
              // Format the date as 'MMM D, YYYY'
              const formattedDate = dataPoint.x.toLocaleDateString("en-US", {
                month: "short", // Abbreviated month
                day: "numeric", // Day without leading zero
                year: "numeric", // Full year
              });
              // Format the time in 24-hour format without seconds
              const formattedTime = dataPoint.x.toLocaleTimeString("en-US", {
                hour: "2-digit", // 2-digit hour
                minute: "2-digit", // 2-digit minute
                hour12: false, // 24-hour format
              });
              // Construct the tooltip text
              return resultScoreFilter < 0
                ? `By ${dataPoint.label} on ${formattedDate} at ${formattedTime}`
                : `${dataPoint.roundedSeconds} seconds per level by ${dataPoint.label} on ${formattedDate} at ${formattedTime}`;
            },
          },
        },
      },
    },
  });
}

// const queryLevels = document.getElementById("queryLevels");
// queryLevels.addEventListener("click", addIsRealField); // Attach new one
// async function addIsRealField() {
//   const snapshot = await getDocs(colRef); // Correctly fetch documents
//   // Check if the collection is empty
//   if (snapshot.empty) {
//     console.log("No documents found in GamesPlayed collection.");
//     return;
//   }
//   const batch = writeBatch(db); // Use a batch write for efficiency
//   snapshot.forEach((doc) => {
//     const docRef = doc.ref;
//     batch.update(docRef, { isReal: true }); // Set isReal to true
//   });
//   // Commit the batch write
//   await batch.commit();
//   console.log("isReal field added to all documents in GamesPlayed collection.");
// }
