
// The two main taxModels functions
var calculateTaxTableCanada = function() {
  return 0;
}

var getTaxRateCanada = function(financialObject) {
  return 0;
}

// Add the tax moodel functions like calculateTaxTable() and getTaxRate() under "canada" in the tax model.
taxModels["canada"] = {};
taxModels["canada"].calculateTaxTable = calculateTaxTableCanada;
taxModels["canada"].getTaxRate = getTaxRateCanada;
