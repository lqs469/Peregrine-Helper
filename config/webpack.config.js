'use strict'

const { resolve } = require('path')
const SizePlugin = require('size-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const _loader = MiniCssExtractPlugin.loader

const PATHS = {
  src: resolve(__dirname, '../src'),
  build: resolve(__dirname, '../build')
}

module.exports = {
  entry: {
    bundle: PATHS.src + '/index.jsx'
  },
  output: {
    path: PATHS.build,
    filename: '[name].js'
  },
  devtool: 'inline-source-map',
  stats: {
    all: false,
    errors: true,
    builtAt: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env', '@babel/react']
          }
        }
      },
      {
        test: /\.css$/,
        use: [_loader, 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'images',
              name: '[name].[ext]'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new SizePlugin(),
    // Copy static assets from `public` folder to `build` folder
    new CopyWebpackPlugin([
      {
        from: '**/*',
        context: 'public'
      }
    ]),
    // Extract CSS into separate files
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ]
}
