/*jshint -W030, -W020 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  'use strict';

  var path = Npm.require('path');
  var fs = Npm.require('fs-extra');

  // this library extends the string prototype
  Npm.require('colors');

  var FRAMEWORK_NAME = 'cucumber';
  var BINARY = process.env.CUKE_MONKEY_PATH || Npm.require('cuke-monkey').bin;
  if (
    process.env.NODE_ENV !== 'development' || !process.env.IS_MIRROR ||
    process.env[FRAMEWORK_NAME.toUpperCase()] === '0' ||
    process.env.VELOCITY === '0' ||
    process.env.FRAMEWORK.indexOf(FRAMEWORK_NAME) !== 0
  ) {
    return;
  }

  DEBUG && console.log('[xolvio:cucumber] Mirror server is initializing');

  var _velocityConnection,
      _velocityTestFiles;

  Meteor.startup(function () {

    DEBUG && console.log('[xolvio:cucumber] Connecting to hub');
    _velocityConnection = DDP.connect(process.env.PARENT_URL);
    _velocityConnection.subscribe('VelocityTestFiles');

    _velocityTestFiles = new Mongo.Collection('velocityTestFiles', {
      connection: _velocityConnection
    });

    _velocityConnection.onReconnect = function () {
      DEBUG && console.log('[xolvio:cucumber] Connected to hub.');
      var debouncedRun = _.debounce(Meteor.bindEnvironment(_findAndRun), 300);
      _velocityTestFiles.find({targetFramework: FRAMEWORK_NAME}).observe({
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

    };

  });

  var _isRunning = false;

  function _findAndRun () {
    if (_isRunning) {
      return;
    }
    _isRunning = true;

    var findAndRun = function () {
      var feature = _velocityTestFiles.findOne({
        targetFramework: FRAMEWORK_NAME,
        status: 'TODO'
      });
      if (feature) {
        _velocityTestFiles.update(feature._id, {$set: {status: 'DOING'}});
        _run(feature, findAndRun);
      } else {
        _isRunning = false;
      }
    };

    if (!!process.env.CUCUMBER_NODES) {
      DEBUG && console.log('[xolvio:cucumber] Running in split-features mode');
      findAndRun();
    } else {
      DEBUG && console.log('[xolvio:cucumber] Running in batch-features mode.');
      _run(null, function () {
        _isRunning = false;
      });
    }

  }

  function _run (feature, callback) {

    var args = [];
    if (feature) {
      console.log('[xolvio:cucumber] Mirror with pid', process.pid, 'is working on', feature.absolutePath);
      args.push(feature.absolutePath);
    } else {
      console.log('[xolvio:cucumber] Cucumber is running');
      _velocityConnection.call('velocity/reports/reset');
    }

    args.push('-r');
    args.push(path.join(
      process.env.VELOCITY_MAIN_APP_PATH, 'tests', 'cucumber', 'features'
    ));
    args.push('--snippets');
    args.push('--ipc');
    args.push('--ddp=' + process.env.ROOT_URL);

    if (process.env.CUCUMBER_COFFEE_SNIPPETS) {
      args.push('--coffee');
    }

    if (process.env.CUCUMBER_TAGS) {
      args.push('--CUCUMBER_TAGS=' + process.env.CUCUMBER_TAGS);
    }

    if (process.env.CUCUMBER_FORMAT) {
      args.push('--format=' + process.env.CUCUMBER_FORMAT);
    } else {
      args.push('--format=pretty');
    }

    if (process.env.WD_TIMEOUT_ASYNC_SCRIPT) {
      args.push('--timeoutsAsyncScript=' + process.env.WD_TIMEOUT_ASYNC_SCRIPT);
    }

    if (process.env.SELENIUM_BROWSER) {
      args.push('--browser=' + process.env.SELENIUM_BROWSER);
    }

    if (DEBUG) {
      args.push('--debug');
    }

    if (process.env.HUB_HOST) {
      args.push('--host=' + process.env.HUB_HOST);
    }
    if (process.env.HUB_PORT) {
      args.push('--port=' + process.env.HUB_PORT);
    }
    if (process.env.HUB_USER) {
      args.push('--user=' + process.env.HUB_USER);
    }
    if (process.env.HUB_KEY) {
      args.push('--key=' + process.env.HUB_KEY);
    }
    if (process.env.HUB_PLATFORM) {
      args.push('--platform=' + process.env.HUB_PLATFORM);
    }
    if (process.env.HUB_VERSION) {
      args.push('--version=' + process.env.HUB_VERSION);
    }




    DEBUG && console.log('[xolvio:cucumber] Running', BINARY, args);
    fs.chmodSync(BINARY, parseInt('555', 8));
    var nodePath = process.execPath;
    var nodeDir = path.dirname(nodePath);
    var env = _.clone(process.env);
    // Expose the Meteor node binary path for the script that is run
    env.PATH = nodeDir + ':' + env.PATH;
    var spawnOptions = {
      cwd: path.resolve(process.env.VELOCITY_MAIN_APP_PATH, 'tests', FRAMEWORK_NAME),
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: env
    };
    var proc = Npm.require('child_process').spawn(BINARY, args, spawnOptions);

    proc.stdout.on('data', function (data) {
      data = data.toString().replace(process.env.VELOCITY_MAIN_APP_PATH, '');
      process.stdout.write(data);
    });
    proc.stderr.pipe(process.stderr);

    proc.on('message', Meteor.bindEnvironment(function (json) {
      _processFeatures(JSON.parse(json));
      if (feature) {
        _velocityTestFiles.update(feature._id, {$set: {status: 'DONE'}});
      } else {
        _velocityConnection.call('velocity/reports/completed', {framework: FRAMEWORK_NAME});
      }
    }));

    proc.on('close', Meteor.bindEnvironment(function (exit, signal) {
      DEBUG && console.log('[xolvio:cucumber] cuke-monkey completed with exit code', exit, signal);
      callback();
    }));

    process.on('exit', function () {
      proc.kill();
    });
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

      if (step.result.error_message.name) {
        report.failureType = step.result.error_message.name;
        report.failureStackTrace = _conditionError(step.result.error_message.message);
      } else {
        report.failureStackTrace = _conditionError(step.result.error_message);
      }
    }

    if (step.result.status === 'undefined') {
      report.result = 'failed';
      report.failureStackTrace = 'This step has not been defined';
    }

    if (step.result.status === 'skipped') {
      report.result = 'failed';
      report.failureStackTrace = 'This step was skipped';
    }

    // skip before/after if they have no errors
    if (!report.failureStackTrace && (step.keyword.trim() === 'Before' || step.keyword.trim() === 'After')) {
      return;
    }

    _velocityConnection.call('velocity/reports/submit', report);

  }

  function _conditionError (errorMessage) {

    if (DEBUG) {
      console.error(errorMessage);
      return errorMessage;
    }

    var msg = '',
        insertDots = false,
        DOTS = '  ...\n';

    try {
      _.each(errorMessage.split('\n'), function (line, index) {
        line = line.trim();
        if (index === 0) {
          msg += line;
          return;
        }
        if (line.indexOf('/tests/cucumber/') !== -1) {
          if (insertDots) {
            msg += DOTS;
            insertDots = false;
          }
          msg += ((index !== 0 ? '  ' : '') +
          line.replace(process.env.VELOCITY_MAIN_APP_PATH, '') + '\n');
        } else {
          insertDots = true;
        }
      });
      if (insertDots) {
        msg += DOTS;
      }

      // TODO deal with this error for users
      // Cannot call method 'convertScenarioOutlinesToScenarios' of undefined

      msg = msg.substring(0, msg.length);
      //console.log(msg.magenta);
    } catch (e) {
      msg = errorMessage;
    }

    return msg;
  }

})();
