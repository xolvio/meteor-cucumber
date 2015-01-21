#0.3.6

* Fixing error in sample tests

#0.3.5

* Added ability to disable cucumber with CUCUMBER=0 env var
* Simplified the example world config
* Added a viewport sizing config in the hooks

#0.3.4

* Fixed #30 - Nasty bug that showed failures as passes!

#0.3.1 - 0.3.3

* Bumping HTML reporter, webdriver and mirror versions

#0.3.0

* Includes HTTP package for testing restful E2E calls
* Updated cucumber to version 0.4.7
* Now includes webdriver by default
* Example world sets up Webdriver

#0.2.0 - 0.2.4

* Void (connection issues messed up build on package server)

#0.1.1

* Fixed issue with mirror starting
* Improved logging
* Swapped lodash to underscore

#0.1.0

* Actually using semvar now!
* Bumped velocity
* Logging now includes full package name

#0.0.13

* Improved de-bouncing
* Updated sample tests

#0.0.7-0.0.12
* Bumping versions

#0.0.6
* Uses new soft mirror
* Runs steps in fibers (Auto wraps step definition callbacks with Meteor.bindEnvironment)

#0.0.6
Bumping to velocity 1.0.0-rc4

#0.0.5
Fixing versions

#0.0.4
Using Velocity RC3

#0.0.3
Now works with a mirror

#0.0.2
Fixed sample test copying
Hid Before/After steps from showing when they don't error

#0.0.1
Initial release. Simple cucumberjs + velocity integration