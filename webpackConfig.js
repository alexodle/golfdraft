const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: "./js/app.tsx",
  plugins: [
    new ExtractTextPlugin("bundle.css")
  ],
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: ["babel-loader", "awesome-typescript-loader" ]},
      { test: /\.eot($|\?)/, use: "url-loader" },
      { test: /\.gif($|\?)/, use: "url-loader?limit=10000&minetype=image/gif" },
      { test: /\.jpg($|\?)/, use: "url-loader?limit=10000&minetype=image/jpg" },
      { test: /\.json($|\?)/, use: 'json-loader' },
      {
        test: /\.jsx($|\?)/,
        use: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.js($|\?)/,
        use: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.less($|\?)/,
        use: ExtractTextPlugin.extract({
          use: [
            'css-loader',
            'autoprefixer-loader?{browsers:["last 2 version", "IE 9"]}',
            'less-loader'
          ],
          fallback: 'style-loader'
        })
      },
      {
        test: /\.css($|\?)/,
        use: ExtractTextPlugin.extract({
          use: [
            'css-loader',
            'autoprefixer-loader?{browsers:["last 2 version", "IE 9"]}'
          ],
          fallback: 'style-loader'
        })
      },
      { test: /\.png($|\?)/, use: "url-loader?limit=10000&minetype=image/png&prefix=/img/" },
      { test: /\.svg($|\?)/, use: "url-loader" },
      { test: /\.ttf($|\?)/, use: "url-loader" },
      { test: /\.woff2?($|\?)/, use: "url-loader?mimetype=application/font-woff" }
    ]
  },
  stats: {
    // Configure the console output
    colors: true,
    modules: true,
    reasons: true
  }
};
