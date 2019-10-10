const webpack = require("webpack");
const merge = require("webpack-merge");
const config = require("./webpack.common");
const TerserPlugin = require("terser-webpack-plugin");
module.exports = merge(config, {
  mode: "production",
  devtool: "source-map",
  entry: {
    index: "./src/index.js",
    globalMatterBox: "./src/globalMatterBox.js",
  },
  plugins: [new webpack.ProgressPlugin()],
  optimization: {
    minimizer: [new TerserPlugin({ sourceMap: true })],
  },
  // externals: {
  //   "matter-js": "Matter",
  // },
});
