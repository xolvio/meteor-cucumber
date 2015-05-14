/*jshint -W030, -W020 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  'use strict';

  var path = Npm.require('path');
  var fs = Npm.require('fs-extra');
  var freeport = Npm.require('freeport');

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
      _velocityTestFiles,
      _cukeMonkeyProc,
      _serverPort,
      _runningParallelTest;

  Meteor.startup(function () {

    _startTheMonkey();

    DEBUG && console.log('[xolvio:cucumber] Connecting to hub');
    _velocityConnection = DDP.connect(process.env.PARENT_URL);
    _velocityConnection.subscribe('VelocityTestFiles');

    _velocityTestFiles = new Mongo.Collection('velocityTestFiles', {
      connection: _velocityConnection
    });

    _velocityConnection.onReconnect = function () {
      DEBUG && console.log('[xolvio:cucumber] Connected to hub.');
      var debouncedRun = _.debounce(Meteor.bindEnvironment(_findAndRun), 1000);
      _velocityTestFiles.find({targetFramework: FRAMEWORK_NAME}).observe({
        added: debouncedRun,
        removed: debouncedRun,
        changed: debouncedRun
      });

      process.on('SIGUSR2', Meteor.bindEnvironment(debouncedRun));
      process.on('message', Meteor.bindEnvironment(function (message) {
        DEBUG && console.log('[xolvio:cucumber] Process message seen', message);
        if (message.refresh && message.refresh === 'client') {
          debouncedRun();
        }
      }));

    };

  });

  function _findAndRun () {
    DEBUG && console.log('[xolvio:cucumber] Find and run triggered', arguments);
    var findAndRun = function () {
      var feature =  _velocityConnection.call('velocity/returnTODOTestAndMarkItAsDOING', {framework: FRAMEWORK_NAME});
      if (feature) {
        _runningParallelTest = true;
        _run(feature, findAndRun);
      }

    };

    if (!!process.env.CUCUMBER_NODES) {
      DEBUG && console.log('[xolvio:cucumber] Running in split-features mode');
      !_runningParallelTest && findAndRun();
    } else {
      DEBUG && console.log('[xolvio:cucumber] Running in batch-features mode.');
      _run();
    }

  }

  function _run (feature, cb) {
    if (feature) {
      var _error = false;

      console.log('[xolvio:cucumber] Mirror with pid', process.pid, 'is working on', feature.absolutePath, " port ", _getServerPort());

      try {
        var response = HTTP.get('http://localhost:' + _getServerPort() + '/run/' + feature.absolutePath);
        var results = JSON.parse(response.content);
        _processFeatures(results);
      }
      catch (error) {
        console.error('[xolvio:cucumber] Bad response from cuke-monkey server.'.red, 'port: '.red, _getServerPort(), 'Try rerunning'.red);
        _error = true;
      }

      if (_error) {
        _velocityConnection.call('velocity/featureTestFailed', {featureId: feature._id});
      }
      else {
        _velocityConnection.call('velocity/featureTestDone', {featureId: feature._id});
      }

      _runningParallelTest = false;
      cb && cb();
    } else {
      console.log('[xolvio:cucumber] Cucumber is running'.yellow);
      _velocityConnection.call('velocity/reports/reset', {framework: FRAMEWORK_NAME});

      try {
        HTTP.get('http://localhost:' + _getServerPort() + '/interrupt');

        var response = HTTP.get('http://localhost:' + _getServerPort() + '/run');
        var results = JSON.parse(response.content);
        if (results.length === 0) {
          console.log('[xolvio:cucumber] No features found. Be sure to annotate scenarios'.yellow,
            'you want to run in watch mode with the'.yellow, '@dev'.cyan, 'tag'.yellow);
        }
        _processFeatures(results);
      } catch (e) {
        console.error('[xolvio:cucumber] Bad response from cuke-monkey server. Try rerunning'.red);
        return;
      }

      _velocityConnection.call('velocity/reports/completed', {framework: FRAMEWORK_NAME});

    }

  }

  function _startTheMonkey () {

    DEBUG && console.log('[xolvio:cucumber] Starting the monkey');
    // TODO add node ID to cuke monkey instance
    _cukeMonkeyProc = new sanjo.LongRunningChildProcess('cukeMonkey');
    if (_cukeMonkeyProc.isRunning()) {
      DEBUG && console.log('[xolvio:cucumber] The monkey is already running');
      return;
    }

    var args = _getArgs();

    fs.chmodSync(BINARY, parseInt('555', 8));
    var nodePath = process.execPath;
    var nodeDir = path.dirname(nodePath);
    var env = _.clone(process.env);
    // Expose the Meteor node binary path for the script that is run
    env.PATH = nodeDir + ':' + env.PATH;
    var spawnOptions = {
      cwd: path.resolve(process.env.VELOCITY_MAIN_APP_PATH, 'tests', FRAMEWORK_NAME),
      stdio: 'inherit',
      env: env
    };

    args.push('--server');


    freeport(Meteor.bindEnvironment(function(err, port) {
      _serverPort = port;
      console.log("returnedport ", port);
      args.push('--serverPort=' + _getServerPort());

      console.log("[xolvio:cucumber] args for the monkey", args);

      DEBUG && console.log('[xolvio:cucumber] Starting the monkey with', BINARY, args, spawnOptions);

      _cukeMonkeyProc.spawn({
        command: nodePath,
        args: args,
        options: spawnOptions
      });

      DEBUG && console.log('[xolvio:cucumber] Cuke-Monkey process forked with pid', _cukeMonkeyProc.getPid());

    }))

  }

  function _getServerPort () {
      return _serverPort;
  }

  function _getScreenshotsDir () {
    var _screenshotsDir = process.env.CUCUMBER_SCREENSHOTS_DIR ||
      path.resolve(process.env.VELOCITY_MAIN_APP_PATH, 'tests', FRAMEWORK_NAME, '.screenshots');
    DEBUG && console.log('[xolvio:cucumber] Screenshots dir is', _screenshotsDir);
    var ssDir = path.resolve(_screenshotsDir);
    return ssDir;
  }

  function _getArgs () {

    var args = [];

    args.push(BINARY);

    args.push('-r');
    args.push(path.join(process.env.VELOCITY_MAIN_APP_PATH, 'tests', 'cucumber', 'features'));
    args.push('--snippets');
    args.push('--ddp=' + process.env.ROOT_URL);
    args.push('--log=error');

    if (DEBUG || process.env.DEBUG) {
      args.push('--debug');
    }

    if (process.env.MONKEY_OPTIONS) {
      var monkeyOptions = process.env.MONKEY_OPTIONS.split(' ');
      while (monkeyOptions.length != 0) {
        args.push(monkeyOptions.pop());
      }
      return args;
    }

    args.push('--screenshotsPath=' + _getScreenshotsDir());

    if (process.env.CUCUMBER_COFFEE_SNIPPETS) {
      args.push('--coffee');
    }

    if (process.env.CUCUMBER_TAGS) {
      args.push('--tags=' + process.env.CUCUMBER_TAGS);
    } else if (!process.env.VELOCITY_CI) {
      args.push('--tags=@dev');
    } else {
      args.push('--tags=~@ignore');
    }

    if (process.env.CUCUMBER_FORMAT) {
      args.push('--format=' + process.env.CUCUMBER_FORMAT);
    }

    if (process.env.WD_TIMEOUT_ASYNC_SCRIPT) {
      args.push('--timeoutsAsyncScript=' + process.env.WD_TIMEOUT_ASYNC_SCRIPT);
    }

    if (process.env.SELENIUM_BROWSER) {
      args.push('--browser=' + process.env.SELENIUM_BROWSER);
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

    return args;

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
      console.error(errorMessage.red);
      return errorMessage;
    }

    var msg = '',
        insertDots = false,
        DOTS = '  ...\n';

    if (errorMessage.indexOf('[xolvio:cucumber] Timed out waiting for asynchronous') !== -1) {
      return errorMessage.substring(errorMessage.lastIndexOf('->') + 3, errorMessage.length).trim()
        + ' timed out';
    }

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
