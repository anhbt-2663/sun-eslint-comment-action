const path = require('path');

module.exports = {
  entry: './index.js',
  target: 'node',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    'fs': 'commonjs fs',
    'path': 'commonjs path',
  },
};