
// The two main taxModels functions
var calculateTaxTableCanada = function() {
  return 0;
}

var getTaxRateCanada = function(financialObject) {
  return 0;
}

// Add the tax moodel functions like calculateTaxTable() and getTaxRate() under "canada" in the tax model.
taxModels["Canada"] = {};
taxModels["Canada"].calculateTaxTable = calculateTaxTableCanada;
taxModels["Canada"].getTaxRate = getTaxRateCanada;

// Put the constructors in. They eed to follow the consistent input format for
// the base "None" tax model.
// taxModels["Canada"]
