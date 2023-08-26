const path = require("path");

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "gamePlay.js",
  },
  devtool: "eval-source-map",
  watch: true,
};
