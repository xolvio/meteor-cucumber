(function () {

  'use strict';

  module.exports = function () {

    var library = this;

    library.Before(function (next) {
      next();
    });

    library.After(function (next) {
      next();
    });

  };

})();