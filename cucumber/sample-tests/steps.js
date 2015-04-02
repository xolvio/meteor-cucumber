module.exports = function () {

  this.Given(/^I am on the home page$/, function (callback) {
    this.browser.
      url('http://localhost:3000').
      call(callback);
  });

  this.When(/^I navigate to "([^"]*)"$/, function (relativePath, callback) {
    this.browser.
      url('http://localhost:3000' + relativePath).
      call(callback);
  });

  this.Then(/^I should see the title of "([^"]*)"$/, function (expectedTitle, callback) {
    this.browser.
      getTitle().should.become(expectedTitle).
      call(callback);
  });

};