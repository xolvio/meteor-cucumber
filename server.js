/*jshint -W020 */

cucumber = {
  isRunning: false
};

(function () {

  'use strict';

  if (process.env.NODE_ENV !== 'development' ||
    process.env.IS_MIRROR) {
    return;
  }

  var path = Npm.require('path'),
      FRAMEWORK_NAME = 'cucumber',
      FRAMEWORK_REGEX = FRAMEWORK_NAME + '/.+\\.(feature|js|coffee|litcoffee|coffee\\.md)$',
      featuresRelativePath = path.join(FRAMEWORK_NAME, 'features'),
      featuresPath = path.join(Velocity.getTestsPath(), featuresRelativePath);

  if (Velocity && Velocity.registerTestingFramework) {
    Velocity.registerTestingFramework(FRAMEWORK_NAME, {
      regex: FRAMEWORK_REGEX,
      sampleTestGenerator: _getSampleTestFiles
    });
  }

  function _getSampleTestFiles () {
    return [{
      path: path.join(featuresRelativePath, 'basket.feature'),
      contents: Assets.getText(path.join('sample-tests', 'feature.feature'))
    }, {
      path: path.join(featuresRelativePath, 'support', 'hooks.js'),
      contents: Assets.getText(path.join('sample-tests', 'hooks.js'))
    }, {
      path: path.join(featuresRelativePath, 'step_definitions', 'basketSteps.js'),
      contents: Assets.getText(path.join('sample-tests', 'steps.js'))
    }, {
      path: path.join(featuresRelativePath, 'support', 'world.js'),
      contents: Assets.getText(path.join('sample-tests', 'world.js'))
    }];
  }

  var _ = Npm.require('lodash'),
      Module = Npm.require('module');

  Meteor.startup(function () {

    var requestId = Meteor.call('velocity/mirrors/request', {
      framework: 'cucumber'
    });

    console.log('[cucumber] Waiting for Velocity to start the mirror');
    VelocityMirrors.find({requestId: requestId}).observe({
      added: function (mirror) {
        console.log('[cucumber] Mirror started. Watching files...');
        cucumber.mirror = mirror;
        VelocityTestFiles.find({targetFramework: FRAMEWORK_NAME}).observe({
          added: _rerunCucumber,
          removed: _rerunCucumber,
          changed: _rerunCucumber
        });
      }
    });

  });

  var _rerunCucumber = function (file) {

    if (cucumber.isRunning) {
      return;
    }
    cucumber.isRunning = true;

    delete Module._cache[file.absolutePath];

    var cuke = Npm.require('cucumber');

    var execOptions = _getExecOptions();
    var configuration = cuke.Cli.Configuration(execOptions),
        runtime = cuke.Runtime(configuration);

    var formatter = new cuke.Listener.JsonFormatter();
    formatter.log = Meteor.bindEnvironment(function (results) {

      Meteor.call('velocity/reports/reset', {framework: FRAMEWORK_NAME}, function () {
        var features = JSON.parse(results);
        _processFeatures(features);
      });
    });

    runtime.attachListener(formatter);
    runtime.attachListener(configuration.getFormatter());

    runtime.start(Meteor.bindEnvironment(function runtimeFinished () {
      Meteor.call('velocity/reports/completed', {framework: FRAMEWORK_NAME}, function () {
        cucumber.isRunning = false;
      });
    }));
  };

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
      if (step.result.error_message.name) {
        report.failureType = step.result.error_message.name;
        // TODO extract message
        //report.failureMessage = step.result.error_message.message;
        // TODO extract problem
        // TODO extract callstack
        report.failureStackTrace = step.result.error_message.message;
      } else {
        report.failureStackTrace = step.result.error_message;
      }
    }

    // skip before/after if they have no errors
    if (!report.failureStackTrace && (step.keyword.trim() === 'Before' || step.keyword.trim() === 'After')) {
      return;
    }

    Meteor.call('velocity/reports/submit', report);
    // Unused fields:
    // browser
    // timestamp
  }

  function _getExecOptions () {

    // TODO externalize these options
    var options = {
      files: [featuresPath],
      //steps: path.join(featuresPath, 'step_definitions'),
      tags: [],
      format: 'progress' // 'summary' 'json' 'pretty' 'progress'
    };

    var execOptions = ['node', 'node_modules/.bin/cucumber-js'];

    if (!_.isEmpty(options.files)) {
      execOptions = execOptions.concat(options.files);
    }

    if (!_.isEmpty(options.steps)) {
      execOptions.push('--require');
      execOptions.push(options.steps);
    }

    if (!_.isEmpty(options.tags)) {
      execOptions.push('--tags');
      execOptions.push(options.tags);
    }

    if (!_.isEmpty(options.format)) {
      execOptions.push('--format');
      execOptions.push(options.format);
    }
    return execOptions;
  }


})();
