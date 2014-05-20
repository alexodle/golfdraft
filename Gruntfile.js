module.exports = function (grunt) {
  'use strict';

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  grunt.initConfig({

    clean: {
      dist: {
        src: 'dist'
      }
    },

    browserify: {
      dist: {
        files: { 'dist/bundle.js': 'js/app.jsx' }
      },
      options: {
        transform: [ require('grunt-react').browserify ]
      }
    },

    uglify: {
      dist: {
        files: { 'dist/bundle.min.js': 'dist/bundle.js' }
      }
    },

    watch: {
      bundle: {
        files: ['js/**/*.js', 'js/**/*.jsx'],
        tasks: ['build']
      }
    }

  });

  grunt.registerTask('build', [
    'clean:dist',
    'browserify:dist',
    'uglify:dist'
  ]);

  grunt.registerTask('default', [
    'build',
    'watch'
  ]);

};
