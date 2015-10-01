(function () {

  'use strict';

  Package.describe({
    name: 'xolvio:cucumber',
    summary: 'CucumberJS for Velocity',
    version: '0.14.4',
    git: 'https://github.com/xolvio/meteor-cucumber.git',
    debugOnly: true
  });

  Npm.depends({
    'chimp': '0.16.2',
    'colors': '1.1.2',
    'fs-extra': '0.24.0',
    "tail-forever": "0.3.11",
    'freeport': '1.0.5'
  });

  Package.onUse(function (api) {

    api.versionsFrom('METEOR@1.2.0.1');

    api.use([
      'underscore',
      'http',
      'velocity:core@0.10.1',
      'velocity:shim@0.1.0',
      'simple:json-routes@1.0.3',
      'sanjo:long-running-child-process@1.1.3'
    ], ['server', 'client']);
    api.use([
      'velocity:html-reporter@0.9.0'
    ], 'client');

    api.addAssets([
      'src/sample-tests/feature.feature',
      'src/sample-tests/steps.js',
      'src/sample-tests/package.json',
      'src/sample-tests/fixture.js'
    ], 'server');

    api.addFiles(['src/hub-server.js'], 'server');
    api.addFiles(['src/mirror-server.js'], 'server');

  });

})();
