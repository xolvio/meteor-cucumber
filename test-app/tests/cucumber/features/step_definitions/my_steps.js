(function () {

  'use strict';

  module.exports = function () {

    // Use normal require here, cucumber is NOT run in a Meteor context (by design)
    var url = require('url');

    this.Given(/^I am on the home page$/, function (callback) {
      // this.ddp is a connection to the mirror
      this.ddp.call('hello', [], function () {
        callback();
      });
    });

    this.When(/^I navigate to "([^"]*)"$/, function (relativePath, callback) {
      // process.env.HOST always points to the mirror
      this.browser.
        url(url.resolve(process.env.HOST, relativePath)).
        call(callback);
    });

    this.Then(/^I should see the title of "([^"]*)"$/, function (expectedTitle, callback) {

      // you can use chai-as-promised, see here: https://github.com/domenic/chai-as-promised/
      this.browser.
        getTitle().should.become(expectedTitle).and.notify(callback);
    });

  };

})();