(function () {

  'use strict';

  Package.describe({
    name: 'xolvio:cucumber',
    summary: 'CucumberJS for Velocity',
    version: '0.14.0-rc.2',
    git: 'https://github.com/xolvio/meteor-cucumber.git',
    debugOnly: true
  });

  Npm.depends({
    'chimp': '0.14.1',
    'colors': '1.0.3',
    'fs-extra': '0.18.0',
    "tail-forever": "0.3.11",
    'freeport': '1.0.5'
  });

  Package.onUse(function (api) {

    api.versionsFrom('METEOR@1.0.3.2');

    api.use([
      'underscore',
      'http',
      'velocity:core@0.9.1',
      'velocity:shim@0.1.0',
      'xolvio:env-set@0.0.2',
      'simple:json-routes@1.0.3',
      'sanjo:long-running-child-process@1.1.1'
    ], ['server', 'client']);
    api.use([
      'velocity:html-reporter@0.7.3'
    ], 'client');

    api.add_files([
      'src/sample-tests/feature.feature',
      'src/sample-tests/steps.js',
      'src/sample-tests/package.json',
      'src/sample-tests/fixture.js'
    ], 'server', {isAsset: true});

    api.addFiles(['src/hub-server.js'], 'server');
    api.addFiles(['src/mirror-server.js'], 'server');

  });

})();
