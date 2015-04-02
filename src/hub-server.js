/*jshint -W030, -W020 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  'use strict';

  var path = Npm.require('path');
  Npm.require('colors');

  var FRAMEWORK_NAME = 'cucumber',
      FRAMEWORK_REGEX = FRAMEWORK_NAME + '/.+\\.(feature|js|coffee|litcoffee|coffee\\.md)$',
      BINARY = Npm.require('cuke-monkey').bin,
      SAMPLE_TESTS = [{
        path: path.join(FRAMEWORK_NAME, 'features', 'sample.feature'),
        contents: Assets.getText(path.join('sample-tests', 'feature.feature'))
      }, {
        path: path.join(FRAMEWORK_NAME, 'features', 'step_definitions', 'sampleSteps.js'),
        contents: Assets.getText(path.join('sample-tests', 'steps.js'))
      }];

  if (process.env.NODE_ENV !== 'development' || process.env.IS_MIRROR ||
    process.env[FRAMEWORK_NAME.toUpperCase()] === '0' || process.env.VELOCITY === '0') {
    return;
  }

  if (Velocity && Velocity.registerTestingFramework) {
    Velocity.registerTestingFramework(FRAMEWORK_NAME, {
      regex: FRAMEWORK_REGEX,
      sampleTestGenerator: function () { return SAMPLE_TESTS; }
    });
  }

  Meteor.startup(function () {
    var initOnce = _.once(Meteor.bindEnvironment(_init));
    VelocityMirrors.find({framework: FRAMEWORK_NAME, state: 'ready'}).observe({
      added: initOnce,
      changed: initOnce
    });
    // TODO replace this when new mirror is ready
    //Meteor.call('velocity/mirrors/request', {framework: FRAMEWORK_NAME});
    initOnce();
  });

  function _init () {
    var debouncedRun = _.debounce(Meteor.bindEnvironment(_run), 300);
    VelocityTestFiles.find({targetFramework: FRAMEWORK_NAME}).observe({
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


  // TODO distributed mode
  //function _run () {
  //  // stop all mirrors and wait for them to stop (if they are running)
  //  // set all feature file status to 'waiting'
  //  // start x mirrors
  //  // * mirrors should set the status 'running' when they are working on a file
  //  // wait for all file statuses to be 'done'
  //  // call 'velocity/complete'
  //  console.log('Notify mirror(s) to run');
  //}

  // TODO remove this when distributed mode works
  function _run () {

    console.log('[xolvio:cucumber] Cucumber is running...');

    var proc = Npm.require('child_process').spawn(BINARY, ['-f', 'json'], {
      cwd: path.resolve(process.env.PWD, 'tests', FRAMEWORK_NAME),
      stdio: null
    });

    var jsonResult = [];
    proc.stdout.on('data', function (data) {
      jsonResult = data.toString();
    });
    proc.stderr.pipe(process.stdout);

    proc.on('close', function () {

      _processFeatures(JSON.parse(jsonResult));

      if (jsonResult.indexOf('"status": "failed"') !== -1) {
        console.log('[xolvio:cucumber]'.reset,'Failed'.red);
      } else {
        console.log('[xolvio:cucumber]'.reset,'Passed'.green);
      }

    });

    process.on('exit', function () { proc.kill(); });
  }

  function _processFeatures (features) {
    _.each(features, function (feature) {
      _processFeature(feature);
    });
  }

  function _processFeature (feature) {
    _.each(feature.elements, function (element) {
      _processFeatureElements(element, feature);
    });
  }

  function _processFeatureElements (element, feature) {
    _.each(element.steps, function (step) {
      _processStep(element, step, feature);
    });
  }

  function _processStep (element, step, feature) {

    // Before elements are converted to steps within scenarios, so no need to
    // process them here
    if (element.type === 'background') {
      return;
    }

    var report = {
      id: element.id + step.keyword + step.name,
      framework: FRAMEWORK_NAME,
      name: step.keyword + step.name,
      result: step.result.status,
      ancestors: [element.name, feature.name]
    };
    if (step.result.duration) {
      report.duration = Math.round(step.result.duration / 1000000);
    }
    if (step.result.error_message) {

      var conditionedError = _conditionError(step.result.error_message);

      if (step.result.error_message.name) {
        report.failureType = step.result.error_message.name;
        // TODO extract message
        //report.failureMessage = step.result.error_message.message;
        // TODO extract problem
        // TODO extract callstack
        report.failureStackTrace = step.result.error_message.message;
      } else {
        report.failureStackTrace = conditionedError;
      }
    }

    // skip before/after if they have no errors
    if (!report.failureStackTrace && (step.keyword.trim() === 'Before' || step.keyword.trim() === 'After')) {
      return;
    }

    // TODO report to hub
    //Meteor.call('velocity/reports/submit', report);
    // Unused fields:
    // browser
    // timestamp
  }

  function _conditionError (errorMessage) {

    if (DEBUG) {
      console.error(errorMessage);
      return errorMessage;
    }

    var msg = '';
    _.each(errorMessage.split('\n'), function (line, index) {
      line = line.trim();
      if (
        line.indexOf('/cuke-monkey/node_modules') === -1 &&
        line.indexOf('node.js:') === -1 &&
        line.indexOf('module.js:') === -1 &&
        line !== ''
      ) {
        msg += (index !== 0 ? '  ' : '') + line.replace(process.env.PWD, '') + '\n';
      }
    });
    msg = msg.substring(0, msg.length - 1);
    console.log('[xolvio:cucumber] '.reset + msg.magenta);
    return msg;
  }




})();
