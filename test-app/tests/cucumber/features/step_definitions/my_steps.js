(function () {

  'use strict';

  module.exports = function () {

    // You can use normal require here, cucumber is NOT run in a Meteor context (by design)
    var url = require('url');

    this.Given(/^I have authored the site title as "([^"]*)"$/, function (title) {
      return this.mirror.call('updateTitle', title); // this.ddp is a connection to the mirror
    });

    this.When(/^I navigate to "([^"]*)"$/, function (relativePath) {
      this.browser. // this.browser is a pre-configured WebdriverIO + PhantomJS instance
        url(url.resolve(process.env.ROOT_URL, relativePath)); // process.env.ROOT_URL always points to the mirror
    });

    this.Then(/^I should see the heading "([^"]*)"$/, function (expectedTitle, callback) {
      // you can use chai-as-promised in step definitions also
      return this.browser.
        waitForVisible('h1'). // WebdriverIO chain-able promise magic
        getText('h1').should.become(expectedTitle);
    });

  };

})();