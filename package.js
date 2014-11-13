(function () {

  'use strict';

  Package.describe({
    name: 'xolvio:cucumber',
    summary: 'CucumberJS for Velocity',
    version: '0.0.5',
    git: 'git@github.com:xolvio/meteor-cucumber.git',
    debugOnly: true
  });

  Npm.depends({
    'cucumber': '0.4.4',
    'lodash': '2.4.1'
  });

  Package.onUse(function (api) {
    api.use([
      'velocity:core@1.0.0-rc.3',
      'velocity:shim@0.0.2'
    ], 'server');
    api.use([
      'velocity:html-reporter@0.3.0-rc.3'
    ], 'client');

    api.add_files([
      'sample-tests/feature.feature',
      'sample-tests/hooks.js',
      'sample-tests/steps.js',
      'sample-tests/world.js'
    ], 'server', {isAsset: true});

    api.addFiles(['server.js'], 'server');

    api.export('cucumber', 'server');
  });

})();