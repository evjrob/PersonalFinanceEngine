// // //
// FIX:
// Deduction model stuff pasted directly from old retirement-estimator.
// // //

// A collection of deduction models. Functions that apply the parameters of
// a deduction model and then return an appropriate value.
var deductionModels = {
  ageAmount: function(deductionObject, taxYear){
    return 0;
  },
  basic: function(deductionObject, taxYear){
    return deductionObject.amount;
  },
  capitalGains: function(deductionObject, taxYear){
    return 0;
  },
  child: function(deductionObject, taxYear){

    // Keep track of the amount available from all dependants combined
    var totalAmount = 0;

    // For each dependant that is a child
    for(var i = 0; i < personalDetails.dependantList.length; i++ ) {
      if (personalDetails.dependantList[i].type == "child" ) {
        var childAge = taxYear - personalDetails.dependantList[i].birthDate.year();
        if (childAge >= 0 && childAge < 18) {

          // Set the deduction amount
          var amount = deductionObject.amount;

          // Add the disability amount if applicable
          if (personalDetails.dependantList[i].disability == "Yes") {
            amount += deductionObject.caregiverAmount;
          }

          // Subtract the value of the spouses income to get eligible remaining amount if amy.
          amount = amount - personalDetails.dependantList[i].income;

          if ( amount > 0 ) {
            totalAmount += amount;
          }
        }
      }
    }

    return totalAmount;

  },
  dividend: function(deductionObject, taxYear){
    return 0;
  },
  eligibleDividend: function(deductionObject, taxYear){
    return 0;
  },
  RRSP: function(deductionObject, taxYear){
    return 0;
  },
  spouse: function(deductionObject, taxYear){

    // Set the deduction amount
    var amount = deductionObject.amount;

    // Add the disability amount if applicable
    if (personalDetails.spouseDisability == "Yes") {
      amount += deductionObject.caregiverAmount;
    }

    // Subtract the value of the spouses income to get eligible remaining amount if amy.
    amount = amount - personalDetails.spouseIncome;

    if ( amount > 0 ) {
      return amount;
    }
    else {
      return 0;
    }
  }
};

// A mapper function that returns the appropriate model based on the
// deduction type passed by the deduction object.
var getDeductionModel = function(type){

    var returnFunction = function(){
      return 0;
    };

    switch (type){

      case "age amount":
        returnFunction = deductionModels.ageAmount;
        console.log("deductionFunction: ageAmount.");
        break;
      case "capital gains":
        returnFunction = deductionModels.capitalGains;
        console.log("deductionFunction: capitalGains.");
        break;
      case "child":
        returnFunction = deductionModels.child;
        console.log("deductionFunction: child.");
        break;
      case "dividend":
        returnFunction = deductionModels.dividend;
        console.log("deductionFunction: dividend.");
        break;
      case "eligible dividend":
        returnFunction = deductionModels.eligibleDividend;
        console.log("deductionFunction: eligibleDividend.");
        break;
      case "basic":
        returnFunction = deductionModels.basic;
        console.log("deductionFunction: basic.");
        break;
      case "RRSP contributon":
        returnFunction = deductionModels.RRSP;
        console.log("deductionFunction: RRSP.");
        break;
      case "spouse":
        returnFunction = deductionModels.spouse;
        console.log("deductionFunction: spouse.");
        break;
    };

    return returnFunction;
  };



// A function that is designed to take a deduction object having a number of
// properties, then return a value corresponding to the amount of eligible
// deductions a user has based on if and how the values in their personal
// details measure up.
var getEligibleDeductions = function(deductions, taxYear) {

  // A detailed object to return the total sum of the deductions and an array of each
  // eligible deduction name with it's applied amount.
  var deductionDetail = {
    totalAmount: 0,
    deductionInfo: []
  };

  // For all of the deductions
  for (var i = 0; i < deductions.length; i++) {

    // A variable to track eligibility
    var isEligible = true;

    // Run through the eligibility requirements
    if (deductions[i].requiresMarriage == true) {
      if (!((personalDetails.familyStatus == "Married") || (personalDetails.familyStatus == "Married Senior"))) {
        isEligible = false;
      }
    }
    if (deductions[i].requiresDependents == true) {
      if (!(personalDetails.numberOfDependents > 0)) {
        isEligible = false;
      }
    }
    if (deductions[i].requiresRetirement == true) {
      if (!((personalDetails.familyStatus == "Single Senior") || (personalDetails.familyStatus == "Married Senior"))) {
        isEligible = false;
      }
    }

    // If the user is still eligible, then apply the value of the deductions
    if (isEligible) {
      deductionFunction = service.getDeductionModel(deductions[i].type);
      var amount = deductionFunction(financialObjects, personalDetails, deductions[i], taxYear);
      deductionDetail.deductionInfo.push( {
        "name": deductions[i].name,
        "amount": amount,
      });
      deductionDetail.totalAmount += amount;
    }
  }

  return deductionDetail;
}

// // //
// END
// // //


// Add the tax moodel functions like calculateTaxTable() and getTaxRate() under "Canada" in the tax model.
taxModels["Canada"] = {};

taxModels["Canada"].taxDay = 31;

taxModels["Canada"].taxMonth = 12;

taxModels["Canada"].calculateTaxTable = function() {
  return 0;
};

taxModels["Canada"].getTaxRate = function(financialObject) {
  return 0;
};

// Put the constructors in. They eed to follow the consistent input format for
// the base "None" tax model.
taxModels["Canada"].chequingAccountConstructor = function(init) {
  ChequingAccount.call(this, init);
};

taxModels["Canada"].assetConstructor = function(init) {
  Asset.call(this, init);
};

taxModels["Canada"].investmentConstructor = function(init) {
  InvestmentAccount.call(this, init);
  this.lastYearTaxableAmount = 0;
};

taxModels["Canada"].debtConstructor = function(init) {
  DebtAccount.call(this, init);
};
