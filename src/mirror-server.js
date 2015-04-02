/*jshint -W030, -W020 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  'use strict';

  var path = Npm.require('path');

  var FRAMEWORK_NAME = 'cucumber';
  var BINARY = Npm.require('cuke-monkey').bin;
  if (process.env.NODE_ENV !== 'development' || process.env.IS_MIRROR ||
    process.env[FRAMEWORK_NAME.toUpperCase()] === '0' || process.env.VELOCITY === '0') {
    return;
  }


  Meteor.startup(function () {
    //_run();
  });

  // TODO get run function from hub-server

})();
