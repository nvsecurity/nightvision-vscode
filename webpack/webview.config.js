//@ts-check

'use strict';

const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
// Oldest NightVision CLI the extension will use without prompting for an
// update. Raise this when the extension starts relying on newer CLI behaviour.
//
// 0.15.0 is the oldest version observed to complete a scan of a target that is
// not reachable from the internet: the QUIC relay transport and its yamux
// fallback arrived in 0.13.0, and older CLIs fail to bring up the relay tunnel
// (NV-4827). This was pinned at 0.9.5 long enough for that to reach a customer,
// so NV-4872 tracks replacing the literal with something that stays current.
const CLI_VERSION = '0.15.0';

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
        // Resolved to an absolute path rather than left as the bare
        // 'process/browser' specifier. webpack-dev-server 6 ships as
        // "type": "module", so its client counts as fully specified ESM, and
        // fully specified resolution ignores resolve.extensions entirely: a
        // bare extensionless specifier cannot resolve from such a module at
        // all. v5 was CommonJS, which is why this only surfaced on the
        // upgrade, and its client logger calling process.hrtime() is what
        // pulls process in.
        process: require.resolve('process/browser'),
      }),
      new webpack.DefinePlugin({
        'process.env': {
          CLI_VERSION: JSON.stringify(CLI_VERSION),
        },
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
