module.exports = function (grunt) {
  'use strict';

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  var webpack = require('webpack');

  grunt.initConfig({

    express: {
      dev: {
         options: {
          script: './server/server.js',
          debug: true,
          output: 'I am fully running now!'
        }
      }
    },

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
    },

    mochaSelenium: {
      options: {
        reporter: 'spec',
        useChaining: true
      },
      firefox: {
        src: ['./test/selenium/test*.js']
      }
    }

  });

  grunt.registerTask('buildd', [
    'clean:dev',
    'webpack:dev',
  ]);

  grunt.registerTask('test', [
    'express:dev',
    'mochaSelenium:firefox'
  ]);

  grunt.registerTask('default', [
    'buildd'
  ]);

};
