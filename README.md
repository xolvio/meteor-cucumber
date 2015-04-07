#Meteor Cucumber

This package gives you Cucumber for Meteor using Velocity. Reactive BDD for the win!

##What is Cucumber?
Cucumber is an open-source Behaviour-Driven Development (BDD) tool popular in Agile circles. It
allows you to define the behaviour of your app using plain text. See below for more details and
examples.

##Features
* Uses [Chai](http://chaijs.com/) & [Chai-as-promised](https://github.com/domenic/chai-as-promised/) promise based assertions
* Auto-configured [WebdriverIO](http://webdriver.io/) with [PhantomJS](http://phantomjs.org/)
* Auto-configured DDP connection to the mirror
* Auto-downloads and configures Selenium to gives you real browser testing locally
* Supports [SauceLabs](https://saucelabs.com/) / [Selenium Grid](http://docs.seleniumhq.org/docs/07_selenium_grid.jsp)
* Reduces CucumberJS stack trace noise by only showing you relevant lines (can be disabled)
* **Experimental** Parallel testing support (see the [super fast e2e testing talk](https://www.youtube.com/watch?v=83dBtU6qy6c))


##Installation
```sh
meteor add xolvio:cucumber
```

##Settings
You can configure settings using environment variables. These are available:

###Cucumber Options
`CUCUMBER_FORMAT=summary | json | progress | pretty (default)`
`CUCUMBER_COFFEE_SNIPPETS=1`
`CUCUMBER_TAGS='@mytag'`

###WebdriverIO Options
`WD_LOG=command/debug/silent (default)`
`WD_TIMEOUT_ASYNC_SCRIPT=10000 (default)`

By default, WebdriverIO is wired up with PhantomJS. You can however run it locally with any other
locally installed browser using Selenium or remotely on SauceLabs / Selenium Grid like this:

####Selenium
`SELENIUM_BROWSER=firefox | chrome | phantomjs (default)`

Note: Selenium comes bundled with a driver for firefox. For other browsers you will have to download those drivers.
[See the full list of 3rd party bindings](http://www.seleniumhq.org/download/).

####SauceLabs / Selenium Grid
`HUB_HOST=ondemand.saucelabs.com | localhost (default)`
`HUB_PORT=xxxx | 80 | 4444 (default)`
`HUB_USER=dude`
`HUB_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxx`
`HUB_PLATFORM='Windows 7' | 'OS X 10.8' | ANY (default)`
`HUB_VERSION=35`

Note this is c

##Example of BDD with Meteor

Here's an example of doing BDD with Meteor + Cucumber:

1. Describe your feature in human readable format using
[Gherkin syntax](https://github.com/cucumber/cucumber/wiki/Gherkin):
```gherkin
Feature: Author a Website

  As a web page author
  I want to set the title of my page
  So that I can create the simplest website in the world

  Scenario: Author using the Meteor settings file
    Given I have created a document with the title "Meteor Cucumber by Xolv.io"
    When  I navigate to "/"
    Then  I see the title "Meteor Cucumber by Xolv.io"
```

2. Upon saving the file you will see this in the log:
```javascript
.UUU.

1 scenario (1 undefined)
3 steps (3 undefined)

You can implement step definitions for undefined steps with these snippets:

this.Given(/^I have authored the site title as "([^"]*)"$/, function (arg1, callback) {
  // Write code here that turns the phrase above into concrete actions
  callback.pending();
});

this.When(/^I navigate to "([^"]*)"$/, function (arg1, callback) {
  // Write code here that turns the phrase above into concrete actions
  callback.pending();
});

this.Then(/^I should see the heading "([^"]*)"$/, function (arg1, callback) {
  // Write code here that turns the phrase above into concrete actions
  callback.pending();
});
```

3. You then take these conveniently generated step definition snippets write the the code to
automate the scenario as concrete actions:

```javascript
this.Given(/^I have authored the site title as "([^"]*)"$/, function (title, callback) {
  // this.ddp is a connection to the mirror available to you in all steps
  this.ddp.call('updateTitle', [title], callback);
});

this.When(/^I navigate to "([^"]*)"$/, function (relativePath, callback) {
  // this.browser is a pre-configured WebdriverIO + PhantomJS instance
  this.browser.
    url(url.resolve(process.env.HOST, relativePath)). // process.env.HOST points to the app
    call(callback);
});

this.Then(/^I should see the heading "([^"]*)"$/, function (expectedTitle, callback) {
  // you can use chai-as-promised in step definitions also
  this.browser.
    waitForVisible('h1'). // WebdriverIO chain-able promise magic
    getText('h1').should.become(expectedTitle).and.notify(callback);
});
```

4. Upon saving you should see a failing test indicator either in the Velocity HTML reporter or the
console:
```bash
  Scenario: Author using the Meteor settings file                        # features/author_a_website.feature:7
    Given I have authored the site title as "Meteor Cucumber by Xolv.io" # features/author_a_website.feature:8
      DDP error: Method not found [404]
    When I navigate to "/"                                               # features/author_a_website.feature:9
    Then I should see the heading "Meteor Cucumber by Xolv.io"           # features/author_a_website.feature:10

    1 scenario (1 failed)
    3 steps (1 failed, 2 skipped)
```

4. You then write the actualizing code to make the above steps work:
```handlebars
<body>
  <h1>Title Has Not Been Set</h1>
</body>
```

```javascript
if (Meteor.isClient) {
  Meteor.call('getTitle', function(err, res) {
    $('h1').text(res).show();
  });
} else {
  Meteor.methods({
    'updateTitle' : function(title) {
      Meteor.settings.pageTitle = title;
    },
    'getTitle' : function() {
      return Meteor.settings.pageTitle;
    }
  });
}
```

5. Now you'll see a passing test indicator:
```bash
  Scenario: Author using the Meteor settings file                        # features/author_a_website.feature:7
    Given I have authored the site title as "Meteor Cucumber by Xolv.io" # features/author_a_website.feature:8
    When I navigate to "/"                                               # features/author_a_website.feature:9
    Then I should see the heading "Meteor Cucumber by Xolv.io"           # features/author_a_website.feature:10

1 scenario (1 passed)
3 steps (3 passed)
```

6. You now write another scenario or another feature.

7. Profit!

##Further Reading

Here are some additional resources about Cucumber and BDD:
* The official [cukes.info](https://cukes.info/) website
* The [Cucumber-js](https://github.com/cucumber/cucumber-js) repository
* The [Gherkin sytax](https://github.com/cucumber/cucumber/wiki/Gherkin) wiki pages
* The [BDD Google Group](https://groups.google.com/forum/#!forum/behaviordrivendevelopment)
* The [Cucumber School](https://cukes.info/school)

Books:
* [The Cucumber Book](https://pragprog.com/book/hwcuc/the-cucumber-book) by Matt Wynne and Aslak Hellesøy
* [Specification by Example](http://www.manning.com/adzic/) by Gojko Adzic (Use this code: cukes38sbe for 38% off)

##Example Projects

* [Letterpress](https://github.com/xolvio/Letterpress)
* [Leaderboard Cucumber](https://github.com/meteor-velocity/velocity-examples/tree/master/leaderboard-cucumber)
