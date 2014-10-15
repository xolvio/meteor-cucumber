(function () {

  'use strict';

  var cucumber = Npm.require('cucumber'),
      _ = Npm.require('lodash');

  var options = {
    // this is how we'll run for only changed test files
    files: ['/Users/sam/WebstormProjects/meteor-testing/velocity-example/tests/cucumber/features'],
//    steps: 'path/to/step_definitions',
    tags: [],
    format: 'pretty' //  'progress'
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
    // this is what we'll report from
    console.log(JSON.parse(results));
  };

  runtime.attachListener(formatter);
  runtime.attachListener(configuration.getFormatter());

  runtime.start(function () {
    console.log('Tell Velocity we are done');
  });
})();