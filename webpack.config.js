// import webpack from 'webpack';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import CopyPlugin from 'copy-webpack-plugin';

// 解决 __dirname 在 ESM 下的问题
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  const isProduction = env === 'production';

  return {
    entry: {
      main: './src/main.ts',
      preload: './src/preload.ts',
    },
    target: 'electron-main',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
      new CopyPlugin({
        patterns: [
          { from: './src/server', to: 'server' },
          { from: './src/ui', to: 'ui' },
        ],
      }),
    ],
    mode: isProduction ? 'production' : 'development',
  };
};
