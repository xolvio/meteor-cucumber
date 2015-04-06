/*jshint -W030, -W020 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  'use strict';

  var path = Npm.require('path');

  var FRAMEWORK_NAME = 'cucumber',
      FRAMEWORK_REGEX = FRAMEWORK_NAME + '/.+\\.(feature|js|coffee|litcoffee|coffee\\.md)$',
      SAMPLE_TESTS = [{
        contents: Assets.getText(path.join('sample-tests', 'steps.js'))
      }];

  if (process.env.NODE_ENV !== 'development' || process.env.IS_MIRROR ||
    process.env[FRAMEWORK_NAME.toUpperCase()] === '0' || process.env.VELOCITY === '0') {
    return;
  }

  DEBUG && console.log('[xolvio:cucumber] Cucumber hub is loading');

  if (Velocity && Velocity.registerTestingFramework) {
    Velocity.registerTestingFramework(FRAMEWORK_NAME, {
      regex: FRAMEWORK_REGEX,
      sampleTestGenerator: function () { return SAMPLE_TESTS; }
    });
  }

  Meteor.startup(function () {
    Meteor.call('velocity/mirrors/request', {
      framework: FRAMEWORK_NAME,
      args: ['--raw-logs'],
      nodes: 1
    });

    var initOnce = _.once(Meteor.bindEnvironment(_init));
    VelocityMirrors.find({framework: FRAMEWORK_NAME, state: 'ready'}).observe({
      added: initOnce,
      changed: initOnce
    });
  });

  function _init () {

    if (!!process.env.CUCUMBER_SPLIT_FEATURES) {

      var debouncedRun = _.debounce(Meteor.bindEnvironment(_run), 300);
      VelocityTestFiles.find({targetFramework: FRAMEWORK_NAME}).observeChanges({
        added: debouncedRun,
        removed: debouncedRun,
        changed: debouncedRun
      });
      process.on('SIGUSR2', Meteor.bindEnvironment(debouncedRun));
      process.on('message', Meteor.bindEnvironment(function (message) {
        if (message.refresh && message.refresh === 'client') {
          debouncedRun();
        }
      }));

    }
  }

  function _run (id, changes) {

    if (changes && changes.status) {
      // one of the files has changed status. good time to check if all files are done
      if (VelocityTestFiles.find({targetFramework: FRAMEWORK_NAME, status: 'DONE'}).count ===
        VelocityTestFiles.find({targetFramework: FRAMEWORK_NAME}).count) {
        Meteor.call('velocity/reports/completed', {framework: FRAMEWORK_NAME});
      }
      return;
    }

    Meteor.call('velocity/reports/reset');

    // set all file statuses so mirrors can start working on files
    VelocityTestFiles.update(
      {targetFramework: FRAMEWORK_NAME, relativePath: /\.feature$/},
      {$set: {status: 'TODO'}},
      {multi: true}
    );

  }


})();
