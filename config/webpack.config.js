'use strict';

const path = require('path');
const SizePlugin = require('size-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const PATHS = {
    src: path.resolve(__dirname, '../src'),
    build: path.resolve(__dirname, '../build'),
};

// Merge webpack configuration files
const config = {
    entry: {
        'bundle': PATHS.src + '/index.jsx'
    },
    output: {
        // the build folder to output bundles and assets in.
        path: PATHS.build,
        // the filename template for entry chunks
        filename: '[name].js',
    },
    devtool: 'inline-source-map',
    stats: {
        all: false,
        errors: true,
        builtAt: true,
    },
    module: {
        rules: [
            // Help webpack in understanding CSS files imported
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            "@babel/env",
                            "@babel/react"
                        ]
                    },
                },
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            // Check for images imported in .js files and
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: 'images',
                            name: '[name].[ext]',
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        // Print file sizes
        new SizePlugin(),
        // Copy static assets from `public` folder to `build` folder
        new CopyWebpackPlugin([
            {
                from: '**/*',
                context: 'public',
            },
        ]),
        // Extract CSS into separate files
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
    ]
};

module.exports = config;