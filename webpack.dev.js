const webpack = require("webpack");
const merge = require("webpack-merge");
const config = require("./webpack.common");
const HtmlWebpackPlugin = require("html-webpack-plugin");
/*
 * We've enabled HtmlWebpackPlugin for you! This generates a html
 * page for you when you compile webpack, which will make you start
 * developing and prototyping faster.
 *
 * https://github.com/jantimon/html-webpack-plugin
 *
 */
module.exports = merge(config, {
  mode: "development",
  entry: {
    dev: "./src/dev.js",
  },
  devtool: "source-map",
  plugins: [
    new HtmlWebpackPlugin({
      template: `./src/dev.html`,
    }),
  ],
  devServer: {
    open: true,
  },
});
