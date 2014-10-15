(function () {

  'use strict';

  Package.describe({
    name: 'xolvio:cucumber',
    summary: 'Webdriver for Velocity',
    version: '0.0.1',
    git: 'git@github.com:xolvio/meteor-webdriver.git',
    debugOnly: true
  });

  Npm.depends({
    'cucumber': '0.4.4',
    'lodash': '2.4.1'
  });

  Package.onUse(function (api) {
    api.use(['velocity:core@0.2.14'], 'server');
    api.use(['templating'], 'client');

    api.addFiles(['server.js'], 'server');
  });

})();