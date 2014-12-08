module.exports = {
  entry: "./js/app.jsx",
  module: {
    loaders: [
      { test: /\.eot($|\?)/, loader: "file?prefix=/dist/" },
      { test: /\.gif($|\?)/, loader: "url?limit=10000&minetype=image/gif" },
      { test: /\.jpg($|\?)/, loader: "url?limit=10000&minetype=image/jpg" },
      { test: /\.json($|\?)/, loader: 'json' },
      { test: /\.jsx($|\?)/, loader: 'jsx-loader?harmony' },
      { test: /\.less($|\?)/, loader: 'style!css!less' },
      { test: /\.css($|\?)/, loader: 'style!css' },
      { test: /\.png($|\?)/, loader: "url?limit=10000&minetype=image/png&prefix=/img/" },
      { test: /\.svg($|\?)/, loader: "file?prefix=/dist/" },
      { test: /\.ttf($|\?)/, loader: "file?prefix=/dist/" },
      { test: /\.woff($|\?)/, loader: "url?prefix=/dist/&limit=10000&mimetype=application/font-woff" }
    ]
  },
  stats: {
    // Configure the console output
    colors: true,
    modules: true,
    reasons: true
  }
};
