(function () {

  'use strict';

  Package.describe({
    name: 'xolvio:cucumber',
    summary: 'CucumberJS for Velocity',
    version: '0.0.1',
    git: 'git@github.com:xolvio/meteor-cucumber.git',
    debugOnly: true
  });

  Npm.depends({
    'cucumber': '0.4.4',
    'lodash': '2.4.1'
  });

  Package.onUse(function (api) {
    api.use([
      'velocity:core@1.0.0-rc.1',
      'velocity:shim@0.0.2',
      'velocity:html-reporter@0.3.0-rc.1'
    ], 'server');

    api.addFiles(['server.js'], 'server');
  });

})();