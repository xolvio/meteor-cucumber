(function () {

  'use strict';

  module.exports = function () {

    var helper = this;

    helper.World = function (next) {

      next();

    };

  };

})();