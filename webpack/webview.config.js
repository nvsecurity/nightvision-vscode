//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const CLI_VERSION = '0.8.9';

dotenv.config();

const config = [
  {
    name: 'webview',
    target: 'web',
    entry: './src/webview/index.tsx',
    output: {
      filename: 'webview.js',
      path: path.resolve(__dirname, '../dist'),
    },
    devtool: 'source-map',
    resolve: {
      extensions: ['.ts', '.js', '.tsx', '.jsx'],
      alias: {
        '@commands': path.resolve(__dirname, '../src/commands/'),
        '@components': path.resolve(__dirname, '../src/components/'),
        '@contexts': path.resolve(__dirname, '../src/contexts/'),
        '@hooks': path.resolve(__dirname, '../src/hooks/'),
        '@pages': path.resolve(__dirname, '../src/pages/'),
        '@types_': path.resolve(__dirname, '../src/types/'),
        '@constants': path.resolve(__dirname, '../src/constants/'),
        '@queries': path.resolve(__dirname, '../src/queries/'),
        '@icons': path.resolve(__dirname, '../src/icons/'),
        '@utils': path.resolve(__dirname, '../src/utils/'),
        '@styles': path.resolve(__dirname, '../src/styles/'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
            },
          ],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
    performance: {
      hints: false,
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      new webpack.DefinePlugin({
        'process.env': { CLI_VERSION: JSON.stringify(CLI_VERSION) },
      }),
    ],
    devServer: {
      compress: true,
      port: process.env.PORT,
      hot: true,
      allowedHosts: 'all',
      // devMiddleware: {
      //   writeToDisk: true,
      // },
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
  },
];

module.exports = (env, argv) => {
  for (const configItem of config) {
    configItem.mode = argv.mode;

    if (argv.mode === 'production') {
      configItem.devtool = 'hidden-source-map';
    }
  }

  return config;
};
