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

    mochaTest: {
      test: {
        src: ['./test/*Test.js']
      }
    },

    // Experimental at this point
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

  grunt.registerTask('testdata', [
    'mochaTest'
  ]);

  grunt.registerTask('test', [
    //'testselenium',
    'testdata'
  ]);

  grunt.registerTask('default', [
    'buildd'
  ]);

};
