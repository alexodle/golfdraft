var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: "./js/app.jsx",
  plugins: [
    new ExtractTextPlugin("bundle.css")
  ],
  module: {
    loaders: [
      { test: /\.eot($|\?)/, loader: "file?" },
      { test: /\.gif($|\?)/, loader: "url?limit=10000&minetype=image/gif" },
      { test: /\.jpg($|\?)/, loader: "url?limit=10000&minetype=image/jpg" },
      { test: /\.json($|\?)/, loader: 'json' },
      { test: /\.jsx($|\?)/, loader: 'jsx-loader?harmony' },
      {
        test: /\.less($|\?)/,
        loader: ExtractTextPlugin.extract('style-loader', [
          'css-loader',
          'autoprefixer-loader?{browsers:["last 2 version", "IE 9"]}',
          'less-loader',
          ''
        ].join('!'))
      },
      {
        test: /\.css($|\?)/,
        loader: ExtractTextPlugin.extract('style-loader', [
          'css-loader',
          'autoprefixer-loader?{browsers:["last 2 version", "IE 9"]}',
          ''
        ].join('!'))
      },
      { test: /\.png($|\?)/, loader: "url?limit=10000&minetype=image/png&prefix=/img/" },
      { test: /\.svg($|\?)/, loader: "file?" },
      { test: /\.ttf($|\?)/, loader: "file?" },
      { test: /\.woff($|\?)/, loader: "url?&limit=10000&mimetype=application/font-woff" }
    ]
  },
  stats: {
    // Configure the console output
    colors: true,
    modules: true,
    reasons: true
  }
};
