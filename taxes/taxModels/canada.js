// Add the tax moodel functions like calculateTaxTable() and getTaxRate() under "Canada" in the tax model.
taxModels["Canada"] = {};

taxModels["Canada"].calculateTaxTable = function() {
  return 0;
};

taxModels["Canada"].getTaxRate = function(financialObject) {
  return 0;
};

// Put the constructors in. They eed to follow the consistent input format for
// the base "None" tax model.
taxModels["Canada"].assetConstructor = function(init) {
  Asset.call(this, init);
};

taxModels["Canada"].investmentConstructor = function(init) {
  InvestmentAccount.call(this, init);
};

taxModels["Canada"].debtConstructor = function(init) {
  DebtAccount.call(this, init);
};
