/*jshint -W030, -W020 */

DEBUG = !!process.env.VELOCITY_DEBUG;

(function () {

  'use strict';

  var path = Npm.require('path');

  var FRAMEWORK_NAME = 'cucumber';
  var BINARY = process.env.CUKE_MONKEY_PATH || Npm.require('cuke-monkey').bin;
  if (process.env.NODE_ENV !== 'development' || !process.env.IS_MIRROR ||
    process.env[FRAMEWORK_NAME.toUpperCase()] === '0' || process.env.VELOCITY === '0') {
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

  function _findAndRun() {
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

    if (!!process.env.CUCUMBER_SPLIT_FEATURES) {
      DEBUG && console.log('[xolvio:cucumber] Running in split-features mode');
      findAndRun();
    } else {
      DEBUG && console.log('[xolvio:cucumber] Running in batch-features mode.');
      _run(null, function () {
        _isRunning = false;
      });
    }

  }

  function _run(feature, callback) {

    var args = [];
    if (feature) {
      DEBUG && console.log('[xolvio:cucumber] Mirror with pid', process.pid, 'is working on', feature.absolutePath);
      args.push(feature.absolutePath);
    }

    args.push('-r');
    args.push(path.join(process.env.PWD, 'tests','cucumber','features'));
    args.push('--snippets');
    args.push('--ipc');
    args.push('--ddp');
    args.push('--ddp_host=' + process.env.HOST.match(/http:\/\/(.*):/)[1]);
    args.push('--ddp_port=' + process.env.PORT);

    DEBUG && console.log('[xolvio:cucumber] Running', BINARY, args);
    var proc = Npm.require('child_process').spawn(BINARY, args, {
      cwd: path.resolve(process.env.PWD, 'tests', FRAMEWORK_NAME),
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env : process.env
    });

    proc.stdout.on('data', function (data) {
      process.stdout.write(data);
    });
    proc.stderr.pipe(process.stderr);

    proc.on('message', Meteor.bindEnvironment(function (json) {
      _processFeatures(JSON.parse(json));
      if (feature) {
        _velocityTestFiles.update(feature._id, {$set: {status: 'DONE'}});
      } else {
        VelocityTestFiles.update(
          {targetFramework: FRAMEWORK_NAME, relativePath: /\.feature$/},
          {$set: {status: 'DONE'}},
          {multi: true}
        );
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

  function _processFeatures(features) {
    _.each(features, function (feature) {
      _processFeature(feature);
    });
  }

  function _processFeature(feature) {
    _.each(feature.elements, function (element) {
      _processFeatureElements(element, feature);
    });
  }

  function _processFeatureElements(element, feature) {
    _.each(element.steps, function (step) {
      _processStep(element, step, feature);
    });
  }

  function _processStep(element, step, feature) {

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
        report.failureStackTrace = step.result.error_message.message;
      } else {
        report.failureStackTrace = conditionedError;
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

  function _conditionError(errorMessage) {

    if (DEBUG) {
      console.error(errorMessage);
      return errorMessage;
    }

    var msg = '';
    _.each(errorMessage.split('\n'), function (line, index) {
      line = line.trim();
      if (
        line.indexOf('/cuke-monkey/node_modules') === -1 &&
        line.indexOf('(node.js:') === -1 &&
        line.indexOf('(events.js:') === -1 &&
        line.indexOf('(net.js:') === -1 &&
        line.indexOf('(module.js:') === -1 &&
        line.indexOf('_stream_readable.js:') === -1 &&
        line !== ''
      ) {
        msg += (index !== 0 ? '  ' : '') + line.replace(process.env.PWD, '') +
        '\n';
      }
    });

    // TODO deal with this error for users
    // Cannot call method 'convertScenarioOutlinesToScenarios' of undefined


    //at [object Object].emit (events.js:95:17)
    //at [object Object].emit (events.js:117:20)
    //at write (_stream_readable.js:602:24)
    //at flow (_stream_readable.js:611:7)
    //at Socket.pipeOnReadable (_stream_readable.js:643:5)
    //at Socket.emit (events.js:92:17)
    //at emitReadable_ (_stream_readable.js:427:10)
    //at emitReadable (_stream_readable.js:423:5)
    //at readableAddChunk (_stream_readable.js:166:9)
    //at Socket.Readable.push (_stream_readable.js:128:10)
    //at TCP.onread (net.js:529:21)


    msg = msg.substring(0, msg.length - 1);
    console.log(msg.magenta);
    return msg;
  }

})();
