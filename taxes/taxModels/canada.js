
// The two main taxModels functions
var calculateTaxTableCanada = function() {
  return 0;
}

var getTaxRateCanada = function(financialObject) {
  return 0;
}

var assetConstructorCanada = function(init) {
  Asset.call(this, init);
}

var investmentConstructorCanada = function(init) {
  InvestmentAccount.call(this, init);
}

var debtConstructorCanada = function(init) {
  DebtAccount.call(this, init);
}

// Add the tax moodel functions like calculateTaxTable() and getTaxRate() under "Canada" in the tax model.
taxModels["Canada"] = {};
taxModels["Canada"].calculateTaxTable = calculateTaxTableCanada;
taxModels["Canada"].getTaxRate = getTaxRateCanada;

// Put the constructors in. They eed to follow the consistent input format for
// the base "None" tax model.
taxModels["Canada"].assetConstructor = assetConstructorCanada;
taxModels["Canada"].investmentConstructor = investmentConstructorCanada;
taxModels["Canada"].debtConstructor = debtConstructorCanada;
