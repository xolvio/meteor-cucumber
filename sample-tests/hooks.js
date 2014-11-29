(function () {

  'use strict';

  module.exports = function () {

    var helper = this;

    helper.Before(function () {
      arguments[arguments.length-1]();
    });

    helper.After(function () {
      arguments[arguments.length-1]();
    });

  };

})();