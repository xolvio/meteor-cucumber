# 0.14.10

* Updates Velocity core

# 0.14.9

* Adds a CI "once" mode

# 0.14.8

* Updating to chimp 0.17.1

# 0.14.7

* Updates sample specs to synchronous mode
* Updating to chimp 0.17.0
  * Adds CHROME_ARGS option

# 0.14.2

* Updating to chimp 0.16.0
  * Adds CHROME_BIN option

# 0.14.1

* Updating to chimp 0.15.4
* Reinstates chimp-widgets

# 0.14.0

* Meteor 1.2 compatible
* Updating to chimp 0.15.3
* Synchronous WebdriverIO (breaking change)
* Jasmine assertions by default instead of chai (breaking change)
* Global `pending()` and `fail()` methods available in steps
* Screenshots can be attached in the JSON report
* Screenshots name match the step that produced them
* Screenshots can be captured for all steps (not just failing ones)

# 0.13.8

* Updating to chimp 0.12.10

# 0.13.7

* Updating to chimp 0.12.9

# 0.13.4-6
* Broken connection duff releases

# 0.13.3

* Improved logging in Chimp

# 0.13.2

* Using env-set as a temporary workaround to issue in sanjo:long-running-child-process

# 0.13.1

* Uses Chimp update which contains logging improvements and bug fix for runAll button

# 0.13.0

* Added CHIMP_DEBUG to allow debugging of the Chimp and Cucumber child processes
* Added CHIMP_NODE_OPTIONS for finer control over the node process that starts chimp
* Added DEBUG_CUCUMBER and DEBUG_BRK_CUCUMBER that allows you to debug steps
* Pending tests are now considered a failure
* Improved logging

# 0.12.3

* Updated to chimp v0.12.2
* Updated HTML-reporter
* Added offline switch to Chimp
* Added Simian reporting delegate to Chimp
* Fixed sample tests to use new WebdriverIO promises
* Cucumber now only resets its own reports

# 0.12.2

* Exposing the SIMIAN_ACCESS_TOKEN flag for chimp

# 0.12.1

* Upgraded to Chimp 0.12.0 which gives the following:
  * Result reporting to Simian.io
  * Cleans up logs
  * Uses NPM of the main running process

# 0.12.0

* You can now run all specs from the HTML reporter with one button to get feedback over the whole suite
* Increased de-bounce window for multiple-client rerun issue

# 0.11.1

* Updated to Chimp 0.10.1 which detects unhandled promise rejections and fixes 'chimp server' issue
* Results from bad chimp runs are now shown in the reporter
* Fix for hanging pulsating dot for specs that don't pass / are pending
* Improved logging

# 0.11.0

* Updated to Chimp 0.10.0 (includes Webdriver 3.0)
* Fixes multiple selenium server starting issues
* Chrome is now the default browser

# 0.10.0

* Fixes issue where Chrome takes the focus when screenshots for errors are taken (# 142)
* In development mode no screenshots are taken when you use a non-headless browser (Needed to fix # 142)

# 0.9.3

* Merged the parallel execution branch (**** yea!)

# 0.9.2

* Added a CUCUMBER_TAIL environment variable to tail the cucumber.log in the main console
* Added a INSTALL_DEPENDENCIES environment variable for CI build caching purposes
* Updated to latest chimp which uses updated Chai, Chai-as-promised, selenium, chrome/ie drivers

# 0.9.1

* Installs chimp dependencies on main process startup to support build caching on CI servers

# 0.9.0

* Automatically downloads npm dependencies when a package.json file is found in /tests/cucumber

# 0.8.1 - 0.8.9

* Ton of bug fixes
* Sorry for sloppy release note :)

# 0.8.0

* Uses latest cuke-monkey
* Works on Windows
* Updated examples to use new syntax

# 0.7.0

* Now using a long-running child process for cuke-monkey
* Moved process management logic to cuke-monkey
* Added a CUKE_MONKEY_SWITCHES env var to pass raw switches to cuke monkey
* Now watches @dev tags by default. VELOCITY_CI env var can be used on CI severs to run all tags
* Added direct cuke monkey arg passing

# 0.6.6

* Ignore files in tests/cucumber/node_modules

# 0.6.5

* Bumping cuke-monkey version

# 0.6.4

* Changes to app/test code will restart even stale cucumber runs
* Improved process management. Phantom/Selenium are now killed on app/test code changes

# 0.6.3

* Fixed console reporter issue

# 0.6.1 - 0.6.2

* Attempting to add docs to atmosphere

# 0.6.0

* Increased stability by using cuke-monkey npm package
* Rewrote the core
* Improved error messaging by reducing noise
* Works with the new Velocity mirrors
* Moved all runner code into the mirror
* Added experimental parallel testing mode
* Includes a DDP connection to the mirror by default
* Sample tests are much simpler now with a fixture, ddp and webdriver example
* Uses new smaller reporter
* Experimental support for parallel testing

# 0.5.5

* Fix for fs-extra

# 0.5.4

* Fixed compatibility with Meteor 1.0.4+ for client reloading
* Updated all dependencies
* Added fs-extra for lower level fs tests

# 0.5.3

* Fix for Module._cache busting (file changes not working)

# 0.5.2

* Upgraded cucumber.js to 0.4.8

# 0.5.1

* Bumping webdriver version

# 0.5.0

* Baked in Chai and Chai-as-promised into step defs

# 0.4.0

* Major bump of node-soft-mirror and webdriver versions

# 0.3.10

* Fixed issue with patching. bindEnvironment no longer needed

# 0.3.6

* Fixing error in sample tests

# 0.3.5

* Added ability to disable cucumber with CUCUMBER=0 env var
* Simplified the example world config
* Added a viewport sizing config in the hooks

# 0.3.4

* Fixed # 30 - Nasty bug that showed failures as passes!

# 0.3.1 - 0.3.3

* Bumping HTML reporter, webdriver and mirror versions

# 0.3.0

* Includes HTTP package for testing restful E2E calls
* Updated cucumber to version 0.4.7
* Now includes webdriver by default
* Example world sets up Webdriver

# 0.2.0 - 0.2.4

* Void (connection issues messed up build on package server)

# 0.1.1

* Fixed issue with mirror starting
* Improved logging
* Swapped lodash to underscore

# 0.1.0

* Actually using semvar now!
* Bumped velocity
* Logging now includes full package name

# 0.0.13

* Improved de-bouncing
* Updated sample tests

# 0.0.7-0.0.12
* Bumping versions

# 0.0.6
* Uses new soft mirror
* Runs steps in fibers (Auto wraps step definition callbacks with Meteor.bindEnvironment)

# 0.0.6
Bumping to velocity 1.0.0-rc4

# 0.0.5
Fixing versions

# 0.0.4
Using Velocity RC3

# 0.0.3
Now works with a mirror

# 0.0.2
Fixed sample test copying
Hid Before/After steps from showing when they don't error

# 0.0.1
Initial release. Simple cucumberjs + velocity integration
