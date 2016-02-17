// Use a UMD revealing module approach for easy of maintenance and readibility.
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.PersonalFinanceEngine = factory();
  }
}(this, function() {
  "use strict";

  // Define the PersonalFinanceEngine Object for revealing
  var PersonalFinanceEngine.taxes = {};

  return PersonalFinanceEngine.taxes;
}));
