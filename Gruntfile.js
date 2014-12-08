module.exports = function (grunt) {
  'use strict';

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  var webpack = require('webpack');

  grunt.initConfig({
    env: {
      dev: {
        DEBUG: 'DEBUG'
      }
    },

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
      prod: {
        src: 'dist'
      },
      dev: {
        src: 'distd'
      }
    },

    webpack: {
      options: require('./webpackConfig'),

      prod: {
        output: {
          path: './dist/',
          filename: 'bundle.[hash].js'
        },
        storeStatsTo: 'bundle', // use it later as <%= bundle.hash %>
        plugins: [
          new webpack.optimize.DedupePlugin(),
          new webpack.optimize.UglifyJsPlugin(),
          new webpack.optimize.OccurenceOrderPlugin(),
          new webpack.optimize.AggressiveMergingPlugin(),
          new webpack.DefinePlugin({
            // Remove all debug-only code from React
            'process.env': {
              'NODE_ENV': JSON.stringify('production')
            }
          })
        ]
      },

      dev: {
        output: {
          path: './distd/',
          filename: 'bundle.js'
        },
        devtool: 'eval', // Fast rebuild
        watch: true,
        keepalive: true,
        failOnError: false
      }
    },

    mochaTest: {
      test: {
        src: ['./test/*Test.js']
      }
    },

    replace: {
      prod: {
        src: ['./views/index.handlebars'],
        dest: './dist/views/',
        replacements: [
          { from: '$$bundleSrc$$', to: 'dist/bundle.<%= bundle.hash %>.js' }
        ]
      },
      dev: {
        src: ['./views/index.handlebars'],
        dest: './distd/views/',
        replacements: [
          { from: '$$bundleSrc$$', to: 'dist/bundle.js' }
        ]
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

  grunt.registerTask('test', [
    'mochaTest'
  ]);

  grunt.registerTask('buildd', [
    'clean:dev',
    'replace:dev',
    'webpack:dev'
  ]);

  grunt.registerTask('build', [
    'clean:prod',
    'webpack:prod',
    'replace:prod'
  ]);

  grunt.registerTask('rund', [
    'env:dev',
    'express:dev',
    'buildd'
  ]);

  grunt.registerTask('default', [
    'rund'
  ]);

};
