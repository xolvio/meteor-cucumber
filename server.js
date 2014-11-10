(function () {

  'use strict';

  if (process.env.NODE_ENV !== 'development' ||
    process.env.IS_MIRROR) {
    return;
  }

  var path = Npm.require('path'),
      FRAMEWORK_NAME = 'cucumber',
      FRAMEWORK_REGEX = FRAMEWORK_NAME + '/.+\\.(feature|js|coffee|litcoffee|coffee\\.md)$',
      featuresPath = path.join(Velocity.getTestsPath(), FRAMEWORK_NAME, 'features');

  if (Velocity && Velocity.registerTestingFramework) {
    Velocity.registerTestingFramework(FRAMEWORK_NAME, {
      regex: FRAMEWORK_REGEX,
      sampleTestGenerator: _getSampleTestFiles
    });
  }

  function _getSampleTestFiles () {
    return [{
      path: path.join(featuresPath, 'sample.feature'),
      contents: Assets.getText(path.join('sample-tests', 'sample-feature.feature'))
    }, {
      path: path.join(featuresPath, 'step_definitions', 'sample-steps.js'),
      contents: Assets.getText(path.join('sample-tests', 'sample-feature-steps.js'))
    }, {
      path: path.join(featuresPath, 'support', 'actions.js'),
      contents: Assets.getText(path.join('sample-tests', 'actions.js'))
    }, {
      path: path.join(featuresPath, 'support', 'hook.js'),
      contents: Assets.getText(path.join('sample-tests', 'hooks.js'))
    }, {
      path: path.join(featuresPath, 'support', 'world.js'),
      contents: Assets.getText(path.join('sample-tests', 'world.js'))
    }];
  }

  var _ = Npm.require('lodash'),
      Module = Npm.require('module');

  Meteor.startup(function () {
    var cucumberTestsCursor = VelocityTestFiles.find({targetFramework: FRAMEWORK_NAME});
    // FIXME this should wait for the first round of file additions before it starts
    cucumberTestsCursor.observe({
      //added: rerunCucumber,
      //removed: rerunCucumber,
      changed: _rerunCucumber
    });
  });

  var _rerunCucumber = function (file) {

    console.log('- - - - -  ADD/REMOVE/CHANGE DETECTED', file.relativePath);
    delete Module._cache[file.absolutePath];

    var cucumber = Npm.require('cucumber');

    var execOptions = _getExecOptions();
    var configuration = cucumber.Cli.Configuration(execOptions),
        runtime = cucumber.Runtime(configuration);

    var formatter = new cucumber.Listener.JsonFormatter();
    formatter.log = Meteor.bindEnvironment(function (results) {

      Meteor.call('velocity/reports/reset', {framework: FRAMEWORK_NAME}, function () {
        var features = JSON.parse(results);
        _processFeatures(features);
      });
    });

    runtime.attachListener(formatter);
    runtime.attachListener(configuration.getFormatter());

    runtime.start(Meteor.bindEnvironment(function runtimeFinished () {
      Meteor.call('velocity/reports/completed', {framework: FRAMEWORK_NAME});
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
      report.duration = step.result.duration;
    }
    if (step.result.error_message) {
      if (step.result.error_message.name) {
        report.failureType = step.result.error_message.name;
        report.failureMessage = step.result.error_message.message;
      } else {
        report.failureMessage = step.result.error_message;
      }
    }
    console.log('\n', step.keyword + ' - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ');
    //console.log(JSON.stringify(report));
    console.log(report.id, report.result);
    Meteor.call('velocity/reports/submit', report, function (e, r) {
      console.log('velocity/reports/submit response', e, r);
    });

    // Unused:
    // failureStackTrace
    // browser
    // timestamp
  }

  function _getExecOptions () {


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
