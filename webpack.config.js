const path = require('path')

module.exports = {
  mode: 'none',
  entry: {
    // sw: './src/sw.js',
    bundle: './src/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['minify'],
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: '3.9.1',
                  targets: {
                    chrome: '42',
                    ie: '11'
                  }
                }
              ]
            ]
          }
        }
      }
    ]
  }
}
