(function () {

  'use strict';

  module.exports = function () {

    var helper = this;

    this.World = function (next) {

      var world = helper.world = this;

      world.cucumber = Package['xolvio:cucumber'].cucumber;
      world.wdio = Package['xolvio:webdriver'].wdio;

      var options = {
        desiredCapabilities: {browserName: 'PhantomJs'},
        port: 4444,
        logLevel: 'silent'
      };

      world.wdio.getGhostDriver(options, function (browser) {
        world.browser = browser;
        browser.call(next);
      });


    };

  };


})();