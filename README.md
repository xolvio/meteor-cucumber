## [>> BREAKING CHANGES in v0.6.0 - See Below <<](#breaking-changes)

#Meteor Cucumber

This package gives you Cucumber for Meteor using Velocity. Reactive BDD for the win!

##What is Cucumber?
Cucumber is an open-source Behaviour-Driven Development (BDD) tool popular in Agile circles. It
allows you to define the behaviour of your app using plain text. See below for more details and
examples.

##Features
* Uses a Promises enabled fork of CucumberJS (soon)
* Includes [Chai](http://chaijs.com/) & [Chai-as-promised](https://github.com/domenic/chai-as-promised/) promise based assertions by default
* Auto-configured [WebdriverIO](http://webdriver.io/) with [PhantomJS](http://phantomjs.org/)
* Auto-configured a promise-based DDP connection to the mirror
* Auto-downloads and configures Selenium to gives you real browser testing locally
* Supports [SauceLabs](https://saucelabs.com/) / [Selenium Grid](http://docs.seleniumhq.org/docs/07_selenium_grid.jsp) out of the box
* Reduces CucumberJS stack trace noise by only showing you relevant lines (can be disabled)
* **Experimental** Parallel testing support (see the [super fast e2e testing talk](https://www.youtube.com/watch?v=83dBtU6qy6c))


##Installation
```sh
meteor add xolvio:cucumber@0.6.0-rc.6
```

##Usage

###Basic
After adding the package, click the 'Add cucumber sample tests' button in the HTML reporter.
This will create these files in your project:

```
tests
└── cucumber
    ├── features
    │   ├── sample.feature
    │   └── step_definitions
    │       └── sample_steps.js
    └── fixtures
        └── my_fixture.js
```

And you should also see this in the reporter:

![Velocity Failing Test](https://raw.githubusercontent.com/xolvio/meteor-cucumber/master/test-app/public/velocity_failing_tests.png "Velocity Failing Test")

Don't worry, the failure is by design to encourage you to always start with a failing specification.
If you go ahead and change the file `/tests/cucumber/features/sample.feature` and replace
"intentional failure" with the actual title of your site, you should see this:

![Velocity Passing Test](https://raw.githubusercontent.com/xolvio/meteor-cucumber/master/test-app/public/velocity_passing_tests.png "Velocity Passing Test")

See a more detailed [Example of BDD with Meteor](#example-of-bdd-with-meteor) below.

###Step Sugar

Meteor Cucumber uses [Cuke Monkey](https://github.com/xolvio/cuke-monkey) which gives you some sugar
inside the step definitions.

####Chai / Chai-as-Promised

[Chai](http://chaijs.com) and [Chai-as-Promised](https://github.com/domenic/chai-as-promised/) have
been wired in both into the steps (globally) and integrated with WebdriverIO. This means you should
be able to perform assert from any context.

####WebdriverIO
Cuke Monkey, and therefore Meteor Cucumber, use the excellent [WebdriverIO](http://webdriver.io/)
and this comes pre-configured with PhantomJS by default and is available for you to use like this:

```
this.browser.
  getTitle().should.become(expectedTitle).and.notify(callback);
```

Notice the prose uses chai-as-promised instead of dealing with callback nesting.

IMPORTANT: A gotcha to look out for is to be sure to use `and.notify(callback)` instead of using
WebdriverIO's `.call(callback)`. This is because Cucumber doesn't support Promises/A+ (yet). This
is something Xolv.io will be adding to Meteor Cucumber soon.

Note you can also access the browser instance on the global object like this: `global.browser`. This
is useful if you are trying to connect from a context where the world object may have been
destroyed, like a hook.

If you wish to use real browsers, see the [WebdriverIO Options](webdriverio-options) below.

####DDP
You have a DDP connection pre-connected to the mirror that you can access like this:
```
this.ddp.call('yourMethod', [], callback);
```

Be mindful that the signature for the DDP call is not the same as `Meteor.call` but is more like
`Meteor.apply`. You have to provide an arguments array even if you're not passing any parameters.

You can use this connection to either perform API-level end-to-end testing, or to use in conjunction
with fixtures to clear the mirror database or to setup test-data (see [Fixtures](fixtures) below)

The DDP object is an instance of the [node DDP client from oortcloud](https://github.com/oortcloud/node-ddp-client).

Note you can also access the DDP client on the global object like this: `global.ddp`. This is useful
if you are trying to connect from a context where the world object may have been destroyed, like a
hook.

### Fixtures
If you include any source files under the `/tests/cucumber/fixtures` directory, these will be
included on the mirror only. This is very useful as it allows you to have test-only code such as
fixtures. Here's an example that shows you how you can reset your system prior to every scenario:

```javascript
// /tests/cucumber/fixtures
Meteor.methods({
  'reset' : function() {
    MyCollection.remove({});
    MyOtherCollection.remove({});
    // ...
  }
});
```

```javascript
// /tests/cucumber/features/step_definitions/hooks.js
this.Before(function (event, callback) {
  global.ddp.call('reset', [], callback);
}
```

The hook will call the fixture on the mirror and ensure your collections are cleared before each
scenario is run. Magic!

Another pattern for creating fixtures is to do the following inside your app:
```bash
meteor create --package fixtures
```

Then modify the `package.js` file to set the `debugOnly` flag to true like this:
```javascript
Package.describe({
  name: 'fixtures',
  version: '0.0.1',
  debugOnly: true,
  // ...
});
```
The `debugOnly` flag instruct Meteor not to bundle this package when building, which is how you
ensure this package does not make it to production. You can now define all your fixtures in this
package.

###Logging
Logs from the mirror and `cucumber` can be seen in the log file here:

`<your_project_dir>/.meteor/local/log/cucumber.log`

It's advised that you monitor this log file with a command like

`tail -f .meteor/local/log/cucumber.log`

###Adding NPM Modules
You might want to use npm packages inside your steps, like underscore for instance. To do this, you
can add a `package.json` file inside your `/tests/cucumber` directory and include npm modules like
you would in any normal node app. Here's an example:

```
{
  "name": "cucumber-tests",
  "version": "1.0.0",
  "description": "Dependencies for our Cucumber automation layer",
  "dependencies": {
    "fs-extra": "0.18.0",
    "underscore": "^1.8.3"
  }
}

```

Note you still need to manually run `npm install` yourself currently. This may change in future
versions of this package.

###Continuous Integration
Velocity takes care of CI for us by extending the `meteor` command with `meteor --test --once`.

To run your tests for Cucumber you just need to be sure any npm dependencies are installed on the CI
server. So if you have created an npm package file under `tests/cucumber/package.json`, then you
need to run `npm install` prior to running `meteor --test --once`

Here's an example CI script:
```
cd tests/cucumber
npm install
cd ../..
meteor --test --once
```

##Configuration
You can configure settings using environment variables. These are available:

###Cucumber Options
`CUCUMBER_FORMAT=summary | json | progress | pretty (default)`

`CUCUMBER_COFFEE_SNIPPETS=1`

`CUCUMBER_TAGS='@mytag'`

####Experimental: Parallel testing
To enable this mode, you need to set this environment variable:
`CUCUMBER_NODES=4`

This will run 4 separate nodes, each with their own mirror, Cucumber, WebDriverIO and PhantomJS
instances. These nodes will run through a feature at a time until all the features are complete.
For this more to work best, it's advised that you keep your features short, which is generally good
practise anyway.

WARNING: This mode is under development and it may or may not work for you! When it does work for everyone,
it will be awesome!

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

##Example of BDD with Meteor

Here's an example of doing BDD with Meteor + Cucumber:

1) Describe your feature in human readable format using
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

2) Upon saving the file you will see this in the log:

![Not Implemented"](https://raw.githubusercontent.com/xolvio/meteor-cucumber/master/test-app/public/not_implemented.png "Not Implemented")


3) You then take these conveniently generated step definition snippets write the the code to
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

4) Upon saving you should see a failing test indicator either in the Velocity HTML reporter or the
console:

![Failed Specs](https://raw.githubusercontent.com/xolvio/meteor-cucumber/master/test-app/public/failed_step.png "Failed Specs")

5) You then write the actualizing code to make the above steps work:
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

6) Now you'll see a passing test indicator:

![Passing Specs](https://raw.githubusercontent.com/xolvio/meteor-cucumber/master/test-app/public/passing_specs.png "Passing Specs")

7. You now write another scenario or feature by going back to step 1.


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

##Example Meteor Projects

* [Letterpress](https://github.com/xolvio/Letterpress)
* [Leaderboard Cucumber](https://github.com/meteor-velocity/velocity-examples/tree/master/leaderboard-cucumber)

##Breaking Changes

###No more test-proxy package
The latest Velocity 0.6.0 release removed the `test-proxy` package. After you update, please be sure
to remove this package from your `/packages` folder.

###Cukes now runs outside the Meteor context
You no longer have access to the main Meteor app from within your step definitions. You should never
need the main app anyway. Typically users were using Meteor.DDP, but you can now use `this.ddp`
instead which is pre-connected to the mirror. [See the DDP section above](https://github.com/xolvio/meteor-cucumber#ddp) for details.

###No World object
Cuke-monkey already creates and initializes a (simple world object)[https://github.com/xolvio/cuke-monkey/blob/develop/lib/cucumberjs/world.js#L47].
This means no more `helper.world.browser`, instead you can just replace all those calls with
`this.browser`.

If you need a World object, please get in touch by reporting an issue and letting us know what
you're trying to do.

