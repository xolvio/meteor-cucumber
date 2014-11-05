var featureSteps = function () {

  this.Given(/^I have added an item to my basket/, function (callback) {
    // Write code here that turns the phrase above into concrete actions
    //callback.pending();
    callback();
  });


  this.When(/^When I click checkout/, function (arg1, arg2, callback) {
    // Write code here that turns the phrase above into concrete actions
    //callback.pending();
    callback.fail('WHAT THE...');
  });

  this.Then(/^I should see a summary of my order$/, function (arg1, arg2, callback) {
    // Write code here that turns the phrase above into concrete actions
    //callback.pending();
    callback();
  });

  this.Then(/^I should see a pay button$/, function (arg1, arg2, callback) {
    // Write code here that turns the phrase above into concrete actions
    //callback.pending();
    callback();
  });


};

module.exports = featureSteps;