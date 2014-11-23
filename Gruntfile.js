module.exports = function (grunt) {
  'use strict';

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  var webpack = require('webpack');

  grunt.initConfig({

    clean: {
      dev: {
        src: 'distd'
      }
    },

    webpack: {
      options: require('./webpackConfig'),

      dev: {
        output: {
          path: "./distd/",
          filename: "bundle.js"
        },
        devtool: "eval", // Fast rebuild
        watch: true,
        keepalive: true
      }
    }

  });

  grunt.registerTask('buildd', [
    'clean:dev',
    'webpack:dev',
  ]);

  grunt.registerTask('default', [
    'buildd'
  ]);

};
