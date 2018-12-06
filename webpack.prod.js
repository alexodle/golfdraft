const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './js/app.tsx',
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/'
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' }),
    new HtmlWebpackPlugin({
      filename: 'index.handlebars',
      template: 'views/index.handlebars'
    }),
    new webpack.HashedModuleIdsPlugin()
  ],
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
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
          { loader: MiniCssExtractPlugin.loader },
          'css-loader',
          'postcss-loader',
          'less-loader'
        ],
      },
      {
        test: /\.css($|\?)/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          'css-loader',
          'postcss-loader'
        ]
      },
      { test: /\.png($|\?)/, use: 'url-loader?limit=10000&minetype=image/png&prefix=/img/' },
      { test: /\.svg($|\?)/, use: 'url-loader' },
      { test: /\.ttf($|\?)/, use: 'url-loader' },
      { test: /\.woff2?($|\?)/, use: 'url-loader?mimetype=application/font-woff' }
    ]
  },
  stats: {
    // Configure the console output
    colors: true,
    modules: true,
    reasons: true
  }
};
