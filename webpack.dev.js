const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    main: './js/app.tsx',
    login: './js/login.tsx',
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'distd'),
    publicPath: '/dist/'
  },
  plugins: [
    new CleanWebpackPlugin(['distd']),
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new HtmlWebpackPlugin({
      chunks: ['main'],
      filename: 'index.handlebars',
      template: 'views/index.handlebars'
    }),
    new HtmlWebpackPlugin({
      chunks: ['login'],
      filename: 'login.handlebars',
      template: 'views/login.handlebars',
    }),
  ],
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
      { test: /\.eot($|\?)/, loader: 'url-loader' },
      { test: /\.gif($|\?)/, loader: 'url-loader?limit=10000&minetype=image/gif' },
      { test: /\.jpg($|\?)/, loader: 'url-loader?limit=10000&minetype=image/jpg' },
      { test: /\.json($|\?)/, loader: 'json-loader' },
      {
        test: /\.less($|\?)/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'less-loader'
        ],
      },
      {
        test: /\.css($|\?)/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },
      { test: /\.png($|\?)/, use: 'url-loader?limit=10000&minetype=image/png&prefix=/img/' },
      { test: /\.svg($|\?)/, use: 'url-loader' },
      { test: /\.ttf($|\?)/, use: 'url-loader' },
      { test: /\.woff2?($|\?)/, use: 'url-loader?mimetype=application/font-woff' }
    ]
  }
};
