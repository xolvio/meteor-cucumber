(function () {

  'use strict';

  module.exports = function () {

    var library = this;

    library.Given(/^I have added an item to my basket/, function (callback) {
      // Write code here that turns the phrase above into concrete actions
      callback();
    });


    library.When(/^When I click checkout/, function (callback) {
      // Write code here that turns the phrase above into concrete actions
      callback();
    });

    library.Then(/^I should see a summary of my order$/, function (callback) {
      // Write code here that turns the phrase above into concrete actions
      callback();
    });

    library.Then(/^I should see a pay button$/, function (callback) {
      // Write code here that turns the phrase above into concrete actions
      callback();
    });

  };

})();