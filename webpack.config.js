const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const distName = "dist";

module.exports = {
  output: {
    path: path.resolve(__dirname, distName)
  },
  resolve: {
    alias: {
      "prosemirror-view": path.resolve(__dirname, "../prosemirror-view/src"),
      "prosemirror-transform": path.resolve(
        __dirname,
        "../prosemirror-transform/src"
      ),
      "prosemirror-state": path.resolve(__dirname, "../prosemirror-state/src"),
      "prosemirror-model": path.resolve(__dirname, "../prosemirror-model/src"),
      "prosemirror-schema-basic": path.resolve(
        __dirname,
        "../prosemirror-schema-basic/src/schema-basic.js"
      ),
      "prosemirror-schema-list": path.resolve(
        __dirname,
        "../prosemirror-schema-list/src/schema-list.js"
      ),
      "prosemirror-example-setup": path.resolve(
        __dirname,
        "../prosemirror-example-setup/src"
      ),
      "prosemirror-menu": path.resolve(__dirname, "../prosemirror-menu/src"),
      "prosemirror-commands": path.resolve(
        __dirname,
        "../prosemirror-commands/src/commands.js"
      )
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: "url-loader"
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html"
    })
  ]
};
