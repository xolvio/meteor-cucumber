(function () {

  'use strict';

  if (process.env.NODE_ENV !== 'development' ||
    process.env.IS_MIRROR) {
    return;
  }

  var path = Npm.require('path'),
      FRAMEWORK_NAME = 'cucumber',
      featuresPath = path.join(Velocity.getTestsPath(), FRAMEWORK_NAME, 'features');

  if (Velocity && Velocity.registerTestingFramework) {
    Velocity.registerTestingFramework(FRAMEWORK_NAME, {
      regex: FRAMEWORK_NAME + '/.+\\.(feature|js|coffee|litcoffee|coffee\\.md)$',
      sampleTestGenerator: function () {
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
    });
  }

  var cucumber = Npm.require('cucumber'),
      _ = Npm.require('lodash');

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

  var configuration = cucumber.Cli.Configuration(execOptions),
      runtime = cucumber.Runtime(configuration);

  var formatter = new cucumber.Listener.JsonFormatter();
  formatter.log = function (results) {

    console.log(results);

    var features = JSON.parse(results);

    _.each(features, function (feature) {
      // TODO parse the feature data
      // "id": "Player-score-can-be-increased-manually",
      // "name": "Player score can be increased manually",
      // "description": "\nAs a score keeper in some hypothetical game\nI want to manually give a player five points\nSo that I can publicly display an up-to-date scoreboard",
      // "line": 1,
      // "keyword": "Feature",
      // "uri": "/Users/sam/WebstormProjects/meteor-testing/velocity-examples/leaderboard-cucumber/tests/cucumber/features/leaderboard.feature"
      _.each(feature.elements, function (element) {
        // TODO parse the element data
        // "name": "Give 5 points to a player",
        // "id": "Player-score-can-be-increased-manually;give-5-points-to-a-player",
        // "line": 7,
        // "keyword": "Scenario",
        // "description": "",
        // "type": "scenario",
        _.each(element.steps, function (step) {
          // TODO parse the step data
          // "name": "I authenticate",
          // "line": 8,
          // "keyword": "Given ",
          // "result": {
          //   "error_message": "WHAT THE...", << only on failure
          //   "duration": 174721,
          //   "status": "passed" // "pending" // "skipped" // "failed"
          // },
          // "match": {}
        });
      });
    });

    //Meteor.call('velocity/reports/submit', {
    //name: '',
    //framework: 'cucumber',
    //result: String,
    //id: Match.Optional(String),
    //ancestors: Match.Optional([String]),
    //timestamp: Match.Optional(Match.OneOf(Date, String)),
    //duration: Match.Optional(Number),
    //browser: Match.Optional(String),
    //failureType: Match.Optional(String),
    //failureMessage: Match.Optional(String),
    //failureStackTrace: Match.Optional(Match.Any)
    //});
  };

  runtime.attachListener(formatter);
  runtime.attachListener(configuration.getFormatter());

  runtime.start(Meteor.bindEnvironment(function () {
    Meteor.call('velocity/reports/completed', {framework: FRAMEWORK_NAME});
  }));

})();