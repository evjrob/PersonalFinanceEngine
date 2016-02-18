// Use a UMD revealing module approach for easy of maintenance and readibility.
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(["moment"], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require("moment"));
  } else {
    root.PersonalFinanceEngine = factory(root.moment);
  }
}(this, function(moment) {
  "use strict";

  // Custom Error type for invalid input to the various create and edit functions
  function InvalidInputError(msg, failedInputs) {
    var err = Error.call(this, msg);
    err.name = "InvalidInputError";
    err.failedInputs = failedInputs;
    return err;
  };

  var validFrequencies = ["Annually", "Semiannually", "Quarterly", "Monthly", "Biweekly", "Weekly"];

  // A function to convert javascript date ojects in inputs to moment objects
  function momentifyDates(input) {

    // Ordinary "date" properties
    if ('date' in input) {
      if (moment.isDate(input.date) || moment.isMoment(input.date)) {
        input.date = moment(input.date);
      } else {
        input.date = moment.invalid();
      }
    };

    // startDate properties
    if ('startDate' in input) {
      if (moment.isDate(input.startDate) || moment.isMoment(input.startDate)) {
        input.startDate = moment(input.startDate);
      } else {
        input.startDate = moment.invalid();
      }
    };

    // endDate properties
    if ('endDate' in input) {
      if (moment.isDate(input.endDate) || moment.isMoment(input.endDate)) {
        input.endDate = moment(input.endDate);
      } else {
        input.endDate = moment.invalid();
      }
    };

    return input;
  }

  // A function that iterates over all of the transfers to find the earliest date a transfer occurs at.
  // This is the minimum date for the model.
  function findMinDate() {
    var minDate;
    // Iterate over all of the financialObjects to find the minDate
    for (var transferID in transferDefinitions) {
      if (transferDefinitions[transferID].date) {
        if (!minDate || transferDefinitions[transferID].date.isBefore(minDate, 'days')) {
          minDate = transferDefinitions[transferID].date;
        }
      } else if (transferDefinitions[transferID].startDate) {
        if (!minDate || transferDefinitions[transferID].startDate.isBefore(minDate, 'days')) {
          minDate = transferDefinitions[transferID].startDate;
        }
      }
    }

    return minDate;
  }

  // A function that first checks if the user has defined their own intended endDate and returns that
  // date if so. Otherwise it iterates over transfers looking for a maximum date to return instead.
  function findMaxDate() {
    var maxDate;

    if (modelParameters.userHasSelectedEndDate) {
      return modelParameters.userSelectedEndDate;
    };

    // Iterate over all of the financialObjects to find the minDate
    for (var transferID in transferDefinitions) {
      if (transferDefinitions[transferID].date) {
        if (!maxDate || transferDefinitions[transferID].date.isAfter(maxDate, 'days')) {
          maxDate = transferDefinitions[transferID].date;
        }
      } else if (transferDefinitions[transferID].endDate) {
        if (!maxDate || (transferDefinitions[transferID].endDate.isAfter(maxDate, 'days'))) {
          maxDate = transferDefinitions[transferID].endDate;
        }
      }
    }

    return maxDate;
  }

  function setUserSelectedEndDate(inputDate) {

    var inputWrapper = {date: inputDate};
    momentifyDates(inputWrapper);

    var promise = new Promise(
      function (resolve, reject) {

        if (validateDate(inputWrapper.date)) {

          modelParameters.userHasSelectedEndDate = true;
          modelParameters.userSelectedEndDate = inputWrapper.date;
          modelParameters.timelineEndDate = modelParameters.userSelectedEndDate;

          resolve();
        } else {

          var err = new InvalidInputError("Inputs failed validation", {date: true});
          reject(err);
        }
      });

    return promise;
  }

  function deleteUserSelectedEndDate() {

    var promise = new Promise(
      function (resolve, reject) {
        modelParameters.userHasSelectedEndDate = false;
        modelParameters.timelineEndDate = findMaxDate();

        resolve();
      });

    return promise
  }

  // Constructors for the parent Financial Object type and it's children types.
  // An init object passed to it to provide the values for initialization
  // These functions are private as a helper function for each is ecxpected to
  // sanitize user inputs first.
  function FinancialObject(init) {
    this.ID = init.ID;
    this.name = init.name;
    this.fromAccount = init.fromAccount;
    this.startDate = init.startDate;      // The startDate for when the initialValue object should clear on the timeline.
    this.initialValue = init.initialValue;
    this.initialTransferID = "",
    this.value = 0;                       //  The value is zero until the initialValue object on the timeline creates the principle
    this.accrualRate = init.accrualRate;  // The annual accrual rate of interest or appreciation or depreciation.
    this.currentYearNetAccruals = 0;      // The realized accruals that have occured this year.
    this.dataTable = [];
    this.associatedTransfers = [];        // An array for the associated transferIDs that occur in userDefinedTransfers
  };

  // At present the default FinancialObject does a good job of modelling an Asset.
  Asset.prototype = Object.create(FinancialObject.prototype);
  function Asset(init) {
    FinancialObject.call(this, init);
    this.type = "Asset";
    this.subType = init.subType;
  };

  // A barebones financial account like a chequing account includes contributions (salary etc)
  FinancialAccount.prototype = Object.create(FinancialObject.prototype);
  function FinancialAccount(init) {
    FinancialObject.call(this, init);
    this.yearsTransfers = 0;
  };

  ChequingAccount.prototype = Object.create(FinancialAccount.prototype);
  function ChequingAccount(init) {
    FinancialAccount.call(this, init);
    this.type = "Chequing";
    this.startDate = modelParameters.timelineStartDate;
    this.initialValue = init.initialValue;
    this.value = init.initialValue;
  };

  InvestmentAccount.prototype = Object.create(FinancialAccount.prototype);
  function InvestmentAccount(init) {
    FinancialAccount.call(this, init);
    this.type = "Investment"
    this.subType = init.subType;
    this.accrualBuffer = 0; // A buffer for accrual changes that haven't been made effective (eg. bank interest that has not yet been deposited)
    this.accrualPaymentFrequency = init.accrualPaymentFrequency; // The number of times per year that accrued interest is deposited.
    this.accrualTransferID = "";
  };

  DebtAccount.prototype = Object.create(FinancialAccount.prototype);
  function DebtAccount(init) {
    FinancialAccount.call(this, init);
    this.type = "Debt"
    this.subType = init.subType;
    this.accrualBuffer = 0; // A buffer for accrual changes that haven't been made effective (eg. bank interest that has not yet been deposited)
    this.accrualPaymentFrequency = init.accrualPaymentFrequency; // The number of times per year that accrued interest is deposited.
    this.accrualTransferID = "";
  };

  // Assets
  function createAsset(inputAsset) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(inputAsset);

    var promise = new Promise(
      function (resolve, reject) {

        var validationPassed = true;
        var failedInputs = {
          name: false,
          subType: false,
          startDate: false,
          fromAccount: false,
          initialValue: false,
          accrualRate: false,
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateName(inputAsset.name)) {
          validationPassed = false;
          failedInputs.name = true;
        };

        if (!validateSubType(inputAsset.subType)) {
          validationPassed = false;
          failedInputs.subType = true;
        };

        if (!validateDate(inputAsset.startDate)) {
          validationPassed = false;
          failedInputs.startDate = true;
        };

        if (!validateFinancialObject(inputAsset.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        } else if (inputAsset.fromAccount !== "external") {
          if (!validateFromAccountStartDate(inputAsset.fromAccount.startDate, inputAsset.startDate)) {
            validationPassed = false;
            failedInputs.fromAccount = true;
          }
        };

        if (!validateInitialValue(inputAsset.initialValue)) {
          validationPassed = false;
          failedInputs.initialValue = true;
        };

        if (!validateAccrualRate(inputAsset.accrualRate)) {
          validationPassed = false;
          failedInputs.accrualRate = true;
        };

        if (validationPassed) {

          var assetID = generateUUID();
          inputAsset.ID = assetID;
          var asset = new Asset(inputAsset);
          assets[assetID] = asset;

          var initialTransfer = {
            fromAccount: assets[assetID].fromAccount,
            toAccount: assets[assetID],
            valueFunction: function(){return assets[assetID].initialValue;},
            date: assets[assetID].startDate,
          };

          createOneTimeTransfer(initialTransfer)
            .then(function (returnID) {
              assets[assetID].initialTransferID = returnID;
              resolve(assetID);
            })
            .catch( function(err) {
              if (err.name !== "InvalidInputError") {
                throw err;
              };
              reject(err);
            });

        } else {
          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err); // failure
        };
      });

      return promise;
  };

  // TODO:  Figure out what to do with any existing transfer definitions that get buggered up if the startDate for the
  //        editted asset gets moved to a startDate later than some or even all of these transfers. Maybe break the link
  //        and set the transfer fromAccount to external, or maybe set the transfer's new date to the startDate of this account?
  function editAsset(assetID, inputAsset) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(inputAsset);

    var promise = new Promise(
      function (resolve, reject) {
        // Do some input checks first, then make Asset
        var validationPassed = true;
        var failedInputs = {
          name: false,
          subType: false,
          startDate: false,
          fromAccount: false,
          initialValue: false,
          accrualRate: false,
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateName(inputAsset.name)) {
          validationPassed = false;
          failedInputs.name = true;
        };

        if (!validateSubType(inputAsset.subType)) {
          validationPassed = false;
          failedInputs.subType = true;
        };

        if (!validateDate(inputAsset.startDate)) {
          validationPassed = false;
          failedInputs.startDate = true;
        };

        if (!validateFinancialObject(inputAsset.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        } else if (inputAsset.fromAccount !== "external") {
          if (!validateFromAccountStartDate(inputAsset.fromAccount.startDate, inputAsset.startDate)) {
            validationPassed = false;
            failedInputs.fromAccount = true;
          }
        };

        if (!validateInitialValue(inputAsset.initialValue)) {
          validationPassed = false;
          failedInputs.initialValue = true;
        };

        if (!validateAccrualRate(inputAsset.accrualRate)) {
          validationPassed = false;
          failedInputs.accrualRate = true;
        };

        if (validationPassed) {

          inputAsset.ID = assetID;
          var tempInitialTransferID = assets[assetID].initialTransferID;
          var tempAssociatedTransfers = assets[assetID].associatedTransfers;
          var asset = new Asset(inputAsset);
          assets[assetID] = asset;
          assets[assetID].initialTransferID = tempInitialTransferID;
          assets[assetID].associatedTransfers =tempAssociatedTransfers;

          var initialTransfer = {
            fromAccount: assets[assetID].fromAccount,
            toAccount: assets[assetID],
            valueFunction: function(){return assets[assetID].initialValue;},
            date: assets[assetID].startDate,
          };

          editOneTimeTransfer(assets[assetID].initialTransferID, initialTransfer)
            .then(function (returnID) {
              resolve(assetID);
            })
            .catch( function(err) {
              if (err.name !== "InvalidInputError") {
                throw err;
              };
              reject(err);
            });

        } else {
          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err); // failure
        };
      });

    return promise;
  };

  function deleteAsset(assetID) {
    // Delete the Asset with the provided UUID.
    var promise = deleteFinancialObject(assetID, assets);
    return promise;
  };

  // Investments
  function createInvestment(inputInvestment) {

    // convert the user provided native Date objects to moment objects
    momentifyDates(inputInvestment);

    var promise = new Promise(
      function (resolve, reject) {
        // Do some input checks first, then make Investment
        var validationPassed = true;
        var failedInputs = {
          name: false,
          subType: false,
          startDate: false,
          fromAccount: false,
          initialValue: false,
          accrualRate: false,
          accrualPaymentFrequency: false,
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateName(inputInvestment.name)) {
          validationPassed = false;
          failedInputs.name = true;
        };

        if (!validateSubType(inputInvestment.subType)) {
          validationPassed = false;
          failedInputs.subType = true;
        };

        if (!validateDate(inputInvestment.startDate)) {
          validationPassed = false;
          failedInputs.startDate = true;
        };

        if (!validateFinancialObject(inputInvestment.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        } else if (inputInvestment.fromAccount !== "external") {
          if (!validateFromAccountStartDate(inputInvestment.fromAccount.startDate, inputInvestment.startDate)) {
            validationPassed = false;
            failedInputs.fromAccount = true;
          }
        };

        if (!validateInitialValue(inputInvestment.initialValue)) {
          validationPassed = false;
          failedInputs.initialValue = true;
        };

        if (!validateAccrualRate(inputInvestment.accrualRate)) {
          validationPassed = false;
          failedInputs.accrualRate = true;
        };

        if (!validateFrequency(inputInvestment.accrualPaymentFrequency)) {
          validationPassed = false;
          failedInputs.accrualPaymentFrequency = true;
        };

        if (validationPassed) {

          var investmentID = generateUUID();
          inputInvestment.ID = investmentID;
          var investment = new InvestmentAccount(inputInvestment);
          investmentAccounts[investmentID] = investment;

          var initialTransfer = {
            fromAccount: investmentAccounts[investmentID].fromAccount,
            toAccount: investmentAccounts[investmentID],
            valueFunction: function(){return investmentAccounts[investmentID].initialValue;},
            date: investmentAccounts[investmentID].startDate,
          };

          var accrualTransfer = {
            fromAccount: "external",
            toAccount: investmentAccounts[investmentID],
            valueFunction: function(){
              var amount = investmentAccounts[investmentID]['accrualBuffer'];
              investmentAccounts[investmentID].accrualBuffer = 0;
              return amount;
            },
            startDate: investmentAccounts[investmentID].startDate,
            frequency: investmentAccounts[investmentID].accrualPaymentFrequency,
          };

          createOneTimeTransfer(initialTransfer)
            .then(function (returnID) {
              investmentAccounts[investmentID].initialTransferID = returnID;
              return createRecurringTransfer(accrualTransfer);
            })
            .then(function (returnID) {
              investmentAccounts[investmentID].accrualTransferID = returnID;
              resolve(investmentID);
            })
            .catch( function(err) {
              if (err.name !== "InvalidInputError") {
                throw err;
              };
              reject(err);
            });

        } else {

          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err); //failed
        };
      });

    return promise;
  };

  function editInvestment(investmentID, inputInvestment) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(inputInvestment);

    var promise = new Promise(
      function (resolve, reject) {
        // Do some input checks first, then make Investment
        var validationPassed = true;
        var failedInputs = {
          name: false,
          subType: false,
          startDate: false,
          fromAccount: false,
          initialValue: false,
          accrualRate: false,
          accrualPaymentFrequency: false,
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateName(inputInvestment.name)) {
          validationPassed = false;
          failedInputs.name = true;
        };

        if (!validateSubType(inputInvestment.subType)) {
          validationPassed = false;
          failedInputs.subType = true;
        };

        if (!validateDate(inputInvestment.startDate)) {
          validationPassed = false;
          failedInputs.startDate = true;
        };

        if (!validateFinancialObject(inputInvestment.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        } else if (inputInvestment.fromAccount !== "external") {
          if (!validateFromAccountStartDate(inputInvestment.fromAccount.startDate, inputInvestment.startDate)) {
            validationPassed = false;
            failedInputs.fromAccount = true;
          }
        };

        if (!validateInitialValue(inputInvestment.initialValue)) {
          validationPassed = false;
          failedInputs.initialValue = true;
        };

        if (!validateAccrualRate(inputInvestment.accrualRate)) {
          validationPassed = false;
          failedInputs.accrualRate = true;
        };

        if (!validateFrequency(inputInvestment.accrualPaymentFrequency)) {
          validationPassed = false;
          failedInputs.accrualPaymentFrequency = true;
        };

        if (validationPassed) {

          inputInvestment.ID = investmentID;
          var tempInitialTransferID = investmentAccounts[investmentID].initialTransferID;
          var tempAssociatedTransfers = investmentAccounts[investmentID].associatedTransfers;
          var investment = new InvestmentAccount(inputInvestment);
          investmentAccounts[investmentID] = investment;
          investmentAccounts[investmentID].initialTransferID = tempInitialTransferID;
          investmentAccounts[investmentID].associatedTransfers = tempAssociatedTransfers;

          var initialTransfer = {
            fromAccount: investmentAccounts[investmentID].fromAccount,
            toAccount: investmentAccounts[investmentID],
            valueFunction: function(){return investmentAccounts[investmentID].initialValue;},
            date: investmentAccounts[investmentID].startDate,
          };

          var accrualTransfer = {
            fromAccount: "external",
            toAccount: investmentAccounts[investmentID],
            valueFunction: function(){
              var amount = investmentAccounts[investmentID]['accrualBuffer'];
              investmentAccounts[investmentID].accrualBuffer = 0;
              return amount;
            },
            startDate: investmentAccounts[investmentID].startDate,
            frequency: investmentAccounts[investmentID].accrualPaymentFrequency,
          };

          editOneTimeTransfer(investmentAccounts[investmentID].initialTransferID, initialTransfer)
            .then(function (returnID) {
              return createRecurringTransfer(accrualTransfer);
            })
            .then(function (returnID) {
              investmentAccounts[investmentID].accrualTransferID = returnID;
              resolve(investmentID);
            })
            .catch( function(err) {
              if (err.name !== "InvalidInputError") {
                throw err;
              };
              reject(err);
            });

        } else {

          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err);

        };
      });

    return promise;
  };

  function deleteInvestment(investmentID) {
    // Delete the Investment with the provided UUID.
    var promise = deleteFinancialObject(investmentID, investmentAccounts);
    return promise;
  };

  // Debts
  function createDebt(inputDebt) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(inputDebt);

    var promise = new Promise(
      function (resolve, reject) {
        // Do some input checks first, then make Debt
        var validationPassed = true;
        var failedInputs = {
          name: false,
          subType: false,
          startDate: false,
          fromAccount: false,
          initialValue: false,
          accrualRate: false,
          accrualPaymentFrequency: false,
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateName(inputDebt.name)) {
          validationPassed = false;
          failedInputs.name = true;
        };

        if (!validateSubType(inputDebt.subType)) {
          validationPassed = false;
          failedInputs.subType = true;
        };

        if (!validateDate(inputDebt.startDate)) {
          validationPassed = false;
          failedInputs.startDate = true;
        };

        if (!validateFinancialObject(inputDebt.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        } else if (inputDebt.fromAccount !== "external") {
          if (!validateFromAccountStartDate(inputDebt.fromAccount.startDate, inputDebt.startDate)) {
            validationPassed = false;
            failedInputs.fromAccount = true;
          }
        };

        if (!validateInitialValue(inputDebt.initialValue)) {
          validationPassed = false;
          failedInputs.initialValue = true;
        };

        if (!validateAccrualRate(inputDebt.accrualRate)) {
          validationPassed = false;
          failedInputs.accrualRate = true;
        };

        if (!validateFrequency(inputDebt.accrualPaymentFrequency)) {
          validationPassed = false;
          failedInputs.accrualPaymentFrequency = true;
        };

        if (validationPassed) {

          var debtID = generateUUID();
          inputDebt.ID = debtID;
          var debt = new DebtAccount(inputDebt);
          debtAccounts[debtID] = debt;

          var initialTransfer = {
            fromAccount: debtAccounts[debtID].fromAccount,
            toAccount: debtAccounts[debtID],
            valueFunction: function(){return debtAccounts[debtID].initialValue;},
            date: debtAccounts[debtID].startDate,
          };

          var accrualTransfer = {
            fromAccount: "external",
            toAccount: debtAccounts[debtID],
            valueFunction: function(){
              var amount = debtAccounts[debtID]['accrualBuffer'];
              debtAccounts[debtID].accrualBuffer = 0;
              return amount;
            },
            startDate: debtAccounts[debtID].startDate,
            frequency: debtAccounts[debtID].accrualPaymentFrequency,
          };

          createOneTimeTransfer(initialTransfer)
            .then(function (returnID) {
              debtAccounts[debtID].initialTransferID = returnID;
              return createRecurringTransfer(accrualTransfer);
            })
            .then(function (returnID) {
              debtAccounts[debtID].accrualTransferID = returnID;
              resolve(debtID);
            })
            .catch( function(err) {
              if (err.name !== "InvalidInputError") {
                throw err;
              };
              reject(err);
            });

        } else {

          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err);
        };
      });

    return promise;
  };

  function editDebt(debtID, inputDebt) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(inputDebt);

    var promise = new Promise(
      function (resolve, reject) {
        // Do some input checks first, then make Debt
        var validationPassed = true;
        var failedInputs = {
          name: false,
          subType: false,
          startDate: false,
          fromAccount: false,
          initialValue: false,
          accrualRate: false,
          accrualPaymentFrequency: false,
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateName(inputDebt.name)) {
          validationPassed = false;
          failedInputs.name = true;
        };

        if (!validateSubType(inputDebt.subType)) {
          validationPassed = false;
          failedInputs.subType = true;
        };

        if (!validateDate(inputDebt.startDate)) {
          validationPassed = false;
          failedInputs.startDate = true;
        };

        if (!validateFinancialObject(inputDebt.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        } else if (inputDebt.fromAccount !== "external") {
          if (!validateFromAccountStartDate(inputDebt.fromAccount.startDate, inputDebt.startDate)) {
            validationPassed = false;
            failedInputs.fromAccount = true;
          }
        };

        if (!validateInitialValue(inputDebt.initialValue)) {
          validationPassed = false;
          failedInputs.initialValue = true;
        };

        if (!validateAccrualRate(inputDebt.accrualRate)) {
          validationPassed = false;
          failedInputs.accrualRate = true;
        };

        if (!validateFrequency(inputDebt.accrualPaymentFrequency)) {
          validationPassed = false;
          failedInputs.accrualPaymentFrequency = true;
        };

        if (validationPassed) {

          inputDebt.ID = debtID;
          var tempInitialTransferID = debtAccounts[debtID].initialTransferID;
          var tempAssociatedTransfers = debtAccounts[debtID].associatedTransfers;
          var debt = new DebtAccount(inputDebt);
          debtAccounts[debtID] = debt;
          debtAccounts[debtID].initialTransferID = tempInitialTransferID;
          debtAccounts[debtID].associatedTransfers = tempAssociatedTransfers;

          var initialTransfer = {
            fromAccount: debtAccounts[debtID].fromAccount,
            toAccount: debtAccounts[debtID],
            valueFunction: function(){return debtAccounts[debtID].initialValue;},
            date: debtAccounts[debtID].startDate,
          };

          var accrualTransfer = {
            fromAccount: "external",
            toAccount: debtAccounts[debtID],
            valueFunction: function(){
              var amount = debtAccounts[debtID]['accrualBuffer'];
              debtAccounts[debtID].accrualBuffer = 0;
              return amount;
            },
            startDate: debtAccounts[debtID].startDate,
            frequency: debtAccounts[debtID].accrualPaymentFrequency,
          };

          editOneTimeTransfer(debtAccounts[debtID].initialTransferID, initialTransfer)
            .then( function () {
              return createRecurringTransfer(accrualTransfer);
            })
            .then(function (returnID) {
              debtAccounts[debtID].accrualTransferID = returnID;
              resolve(debtID);
            })
            .catch( function(err) {
              if (err.name !== "InvalidInputError") {
                throw err;
              };
              reject(err);
            });

        } else {

          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err);

        };
      });

    return promise;
  };

  function deleteDebt(debtID) {
    // Delete the Debt with the provided UUID.
    var promise = deleteFinancialObject(debtID, debtAccounts);
    return promise;
  };

  // A function to delete any FinancialObject. Currenty exposed through the
  // individual Asset, Investment, Debt functions for function naming consistency.
  function deleteFinancialObject(UUID, storageMap) {

    var promise = new Promise(
      function (resolve, reject) {
        // verify the transferID is found
        var financialObject = storageMap[UUID];

        if (validateFinancialObject(financialObject)) {

          financialObject.associatedTransfers.forEach( function(value) {

            if (transferDefinitions[value] !== undefined && transferDefinitions[value] !== null) {
              if (transferDefinitions[value].toAccount === financialObject) {
                transferDefinitions[value].toAccount = "external";
              };
              if (transferDefinitions[value].fromAccount === financialObject) {
                transferDefinitions[value].fromAccount = "external";
              };
              // Delete the transfer if both toAccount and fromAccount are "external"
              if (transferDefinitions[value].toAccount === "external" && transferDefinitions[value].fromAccount === "external") {
                deleteTransfer(value);
              };
            };
          });

          delete storageMap[UUID];
        };

        resolve(null);
      });

    return promise;
  };

  // A constructor to create transfer objects for the timeline.
  function TransferDefinition(fromAccount, toAccount, valueFunction) {
    this.fromAccount = fromAccount;
    this.toAccount = toAccount;
    this.valueFunction = valueFunction;
  };

  // constructor for one time transfers
  OneTimeTransferDefinition.prototype = Object.create(TransferDefinition.prototype);
  function OneTimeTransferDefinition(fromAccount, toAccount, valueFunction, date) {
    TransferDefinition.call(this, fromAccount, toAccount, valueFunction);
    this.type = "OneTime";
    this.date = date;
  };

  // constructor for one time transfers
  RecurringTransferDefinition.prototype = Object.create(TransferDefinition.prototype);
  function RecurringTransferDefinition(fromAccount, toAccount, valueFunction, startDate, endDate, frequency) {
    TransferDefinition.call(this, fromAccount, toAccount, valueFunction);
    this.type = "Recurring";
    this.startDate = startDate;
    this.endDate = endDate;
    this.frequency = frequency; //Eg. "Daily" (hopeffully not), "Weekly", "Biweekly", "Monthly", "Annually"
  };

  // // //
  // Functions for operating on transactions
  // // //
  // Methods to set and change user defined transfers
  function createOneTimeTransfer(newTransfer) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(newTransfer);

    var promise = new Promise(
      function (resolve, reject) {

        var validationPassed = true;
        var failedInputs = {
          fromAccount: false,
          toAccount: false,
          valueFunction: false,
          date: false
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateFinancialObject(newTransfer.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        };

        if (!validateFinancialObject(newTransfer.toAccount)) {
          validationPassed = false;
          failedInputs.toAccount = true;
        };

        if (!validateValueFunction(newTransfer.valueFunction)) {
          validationPassed = false;
          failedInputs.valueFunction = true;
        }

        if (!validateDate(newTransfer.date)) {
          validationPassed = false;
          failedInputs.date = true;
        };

        if (validationPassed) {

          // return an error object matching newTransfer's properties but with false for failed validaions
          var transferID = generateUUID();
          var transferDef = new OneTimeTransferDefinition(newTransfer.fromAccount, newTransfer.toAccount, newTransfer.valueFunction, newTransfer.date);
          transferDefinitions[transferID] = transferDef;

          // Add the transferID to the associatedTransfers arrays on each FinancialAccount
          if (newTransfer.fromAccount !== "external") {
            if (newTransfer.fromAccount.associatedTransfers.indexOf(transferID) === -1) {
              newTransfer.fromAccount.associatedTransfers.push(transferID);
            }
          }

          if (newTransfer.toAccount !== "external") {
            if (newTransfer.toAccount.associatedTransfers.indexOf(transferID) === -1) {
              newTransfer.toAccount.associatedTransfers.push(transferID);
            }
          }

          modelParameters.timelineStartDate = findMinDate();
          modelParameters.timelineEndDate = findMaxDate();
          resolve(transferID);

        } else {

          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err);

        }
      });

    return promise;
  };
  function editOneTimeTransfer(transferID, newTransfer) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(newTransfer);

    var promise = new Promise(
      function (resolve, reject) {

        var validationPassed = true;
        var failedInputs = {
          fromAccount: false,
          toAccount: false,
          valueFunction: false,
          date: false
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateFinancialObject(newTransfer.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        };

        if (!validateFinancialObject(newTransfer.toAccount)) {
          validationPassed = false;
          failedInputs.toAccount = true;
        };

        if (!validateValueFunction(newTransfer.valueFunction)) {
          validationPassed = false;
          failedInputs.valueFunction = true;
        }

        if (!validateDate(newTransfer.date)) {
          validationPassed = false;
          failedInputs.date = true;
        };

        if (validationPassed) {

          var originalFromAccount = transferDefinitions[transferID].fromAccount;
          var originalToAccount = transferDefinitions[transferID].toAccount;

          // return an  error object matching newTransfer's properties but with false for failed validaions
          var transferDef = new OneTimeTransferDefinition(newTransfer.fromAccount, newTransfer.toAccount, newTransfer.valueFunction, newTransfer.date);

          // If the accounts changed then delete the existing account(s) and add the new ones.
          if (newTransfer.fromAccount !== "external") {
            if (newTransfer.fromAccount !== originalFromAccount && newTransfer.fromAccount.associatedTransfers.indexOf(transferID) === -1) {
              newTransfer.fromAccount.associatedTransfers.push(transferID);
              var fromAccountTransferIndex = originalFromAccount.associatedTransfers.indexOf(transferID);
              originalFromAccount.associatedTransfers.splice(fromAccountTransferIndex, 1);
            }
          }

          if (newTransfer.toAccount !== "external") {
            if (newTransfer.toAccount !== originalToAccount && newTransfer.toAccount.associatedTransfers.indexOf(transferID) === -1) {
              newTransfer.toAccount.associatedTransfers.push(transferID);
              var toAccountTransferIndex = originalToAccount.associatedTransfers.indexOf(transferID);
              originalToAccount.associatedTransfers.splice(toAccountTransferIndex, 1);
            }
          }

          transferDefinitions[transferID] = transferDef;

          modelParameters.timelineStartDate = findMinDate();
          modelParameters.timelineEndDate = findMaxDate();
          resolve(transferID);

        } else {

          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err);

        };
      });

    return promise;
  };
  function createRecurringTransfer(newTransfer) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(newTransfer);

    var promise = new Promise(
      function (resolve, reject) {

        var validationPassed = true;
        var failedInputs = {
          fromAccount: false,
          toAccount: false,
          valueFunction: false,
          startDate: false,
          endDate: false,
          frequency: false,
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateFinancialObject(newTransfer.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        };

        if (!validateFinancialObject(newTransfer.toAccount)) {
          validationPassed = false;
          failedInputs.toAccount = true;
        };

        if (!validateValueFunction(newTransfer.valueFunction)) {
          validationPassed = false;
          failedInputs.valueFunction = true;
        }

        if (!validateDate(newTransfer.startDate)) {
          validationPassed = false;
          failedInputs.startDate = true;
        };

        if ("endDate" in newTransfer) {
          if (!validateDate(newTransfer.endDate)) {
            validationPassed = false;
            failedInputs.endDate = true;
          };
        }

        if (!validateFrequency(newTransfer.frequency)) {
          validationPassed = false;
          failedInputs.frequency = true;
        };

        if (validationPassed) {

          // return an error object matching newTransfer's properties but with false for failed validaions
          var transferID = generateUUID();
          var transferDef = new RecurringTransferDefinition(newTransfer.fromAccount, newTransfer.toAccount, newTransfer.valueFunction, newTransfer.startDate, newTransfer.endDate, newTransfer.frequency);
          transferDefinitions[transferID] = transferDef;

          // Add the transferID to the associatedTransfers arrays on each FinancialAccount
          if (newTransfer.fromAccount !== "external") {
            if (newTransfer.fromAccount.associatedTransfers.indexOf(transferID) === -1) {
              newTransfer.fromAccount.associatedTransfers.push(transferID);
            }
          }

          if (newTransfer.fromAccount !== "external") {
            if (newTransfer.toAccount.associatedTransfers.indexOf(transferID) === -1) {
              newTransfer.toAccount.associatedTransfers.push(transferID);
            }
          }

          modelParameters.timelineStartDate = findMinDate();
          modelParameters.timelineEndDate = findMaxDate();
          resolve(transferID);

        } else {

          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err);

        };
      });

    return promise;
  };
  function editRecurringTransfer(transferID, newTransfer) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(newTransfer);

    var promise = new Promise(
      function (resolve, reject) {

        var validationPassed = true;
        var failedInputs = {
          fromAccount: false,
          toAccount: false,
          valueFunction: false,
          startDate: false,
          endDate: false,
          frequency: false,
        };

        // Checks on input like valid date, valid from / to accounts etc
        if (!validateFinancialObject(newTransfer.fromAccount)) {
          validationPassed = false;
          failedInputs.fromAccount = true;
        };

        if (!validateFinancialObject(newTransfer.toAccount)) {
          validationPassed = false;
          failedInputs.toAccount = true;
        };

        if (!validateValueFunction(newTransfer.valueFunction)) {
          validationPassed = false;
          failedInputs.valueFunction = true;
        }

        if (!validateDate(newTransfer.startDate)) {
          validationPassed = false;
          failedInputs.startDate = true;
        };

        if ("endDate" in newTransfer) {
          if (!validateDate(newTransfer.endDate)) {
            validationPassed = false;
            failedInputs.endDate = true;
          };
        }

        if (!validateFrequency(newTransfer.frequency)) {
          validationPassed = false;
          failedInputs.frequency = true;
        };

        if (validationPassed) {

          var originalFromAccount = transferDefinitions[transferID].fromAccount;
          var originalToAccount = transferDefinitions[transferID].toAccount;

          var transferDef = new RecurringTransferDefinition(newTransfer.fromAccount, newTransfer.toAccount, newTransfer.valueFunction, newTransfer.startDate, newTransfer.endDate, newTransfer.frequency);

          // If the accounts changed then delete the existing account(s) and add the new ones.
          if (newTransfer.fromAccount !== "external") {
            if (newTransfer.fromAccount !== originalFromAccount && newTransfer.fromAccount.associatedTransfers.indexOf(transferID) === -1) {
              newTransfer.fromAccount.associatedTransfers.push(transferID);
              var fromAccountTransferIndex = originalFromAccount.associatedTransfers.indexOf(transferID);
              originalFromAccount.associatedTransfers.splice(fromAccountTransferIndex, 1);
            }
          }

          if (newTransfer.fromAccount !== "external") {
            if (newTransfer.toAccount !== originalToAccount && newTransfer.toAccount.associatedTransfers.indexOf(transferID) === -1) {
              newTransfer.toAccount.associatedTransfers.push(transferID);
              var toAccountTransferIndex = originalToAccount.associatedTransfers.indexOf(transferID);
              originalToAccount.associatedTransfers.splice(toAccountTransferIndex, 1);
            }
          }

          transferDefinitions[transferID] = transferDef;

          modelParameters.timelineStartDate = findMinDate();
          modelParameters.timelineEndDate = findMaxDate();
          resolve(transferID);

        } else {

          var err = new InvalidInputError("Inputs failed validation", failedInputs);
          reject(err);

        };
      });

    return promise;
  };
  function deleteTransfer(transferID) {

    var promise = new Promise(
      function (resolve, reject) {
        // verify the transferID is found
        var transfer = transferDefinitions[transferID];

        if (transfer !== undefined && transfer !== null) {
          // delete the transferID from the associatedTransfers on each
          if (transfer.fromAccount !== "external") {
            var fromAccountTransferIndex = transfer.fromAccount.associatedTransfers.indexOf(transferID);
            if (fromAccountTransferIndex !== -1) {
              transfer.fromAccount.associatedTransfers.splice(fromAccountTransferIndex, 1);
            }
          }
          if (transfer.toAccount !== "external") {
            var toAccountTransferIndex = transfer.toAccount.associatedTransfers.indexOf(transferID);
            if (toAccountTransferIndex !== -1) {
              transfer.toAccount.associatedTransfers.splice(toAccountTransferIndex, 1);
            }
          }

          delete transferDefinitions[transferID];
          modelParameters.timelineStartDate = findMinDate();
        };

        resolve(null);
      });
    return promise;
  };

  // Define the PersonalFinanceEngine Object for revealing
  var PersonalFinanceEngine = {};

  var modelParameters = {
    timelineStartDate: new moment(),
    timelineEndDate: new moment(),
    userHasSelectedEndDate: false,
    userSelectedEndDate: new moment(),
  };
  var locale = {
    Country: "Canada",
    Province: "Alberta"
  };            // A top level object to store more gobal details like inflation, taxes, etc. Stuff that isn't really a personalDetail.
  var personalDetails = {};
  var chequingAccount = new ChequingAccount({
    ID: "1",
    name: "Test",
    startDate: modelParameters.timelineStartDate, //SHould it be this date or should it be the present date? Historical transfers woul require not preset.
    initialValue: 0,  // Start balance of $1000
    accrualRate: 0 // With a negative accrual weight (depreciation) of 5% annually.
  });
  var assets = {};            // Object map of assets that can appreciate or depreciate like a car or house, etc.
  var investmentAccounts = {};// Object map for investment financial accounts like RRSP, TFSA, etc.
  var debtAccounts = {};      // Object map like mortgage (tied to the house asset), loans, etc.

  // A transfer method to transfer funds from account1 to account2
  // All changes to the value of an account should occur
  // through a transfer. External accounts are treated as undefined.
  function transfer(fromAccount, toAccount, transferAmount) {
    if (fromAccount !== "external") {
      fromAccount.value -= transferAmount;
    }
    if (toAccount !== "external")  {
      toAccount.value += transferAmount;
    }
  }

  // The timeline is and object based map of the following structure
  //  var timeline = {
  //    <date>: [
  //      transfer(),
  //      transfer(),
  //      ...
  //    ],
  //    <date>: [ ... ],
  //    ...
  //}

  // Use a "transactional timeline" model for the financial accounts
  // for key dates in timeline, complete transfers, and record object
  // balances and other figures in correct tables if it's a scheduled task.
  var timeline = {}; // The internal timeline built by constructTimeline() and used by calculate()

  function constructTimeline() {
    // Get the minimum and maximum dates to populate over
    var minDate = modelParameters.timelineStartDate;
    var maxDate = modelParameters.timelineEndDate;

    // Fill in date entries for the regular periods like December 31st for taxes,
    // for reporting dates. EG. every dec 31st, last day of every month, etc. depending.

    // Regular contributions and interest deposits, or other user defined transfers etc that occur between min and max dates.
    for (var transferID in transferDefinitions) {
      // Place the transfer functions into to the timeline for this definition.

    }
  }

  // A map of all the transfer definitions created by the user and by the initial value transfers for the
  // different financial objects the user has created.
  var transferDefinitions = {};

  function getTaxModel() {
    // Using the user's locale information fetch the appropriate
    // tax model function and parameters from the json files to
    // put into calculateTaxes();
  }

  function calculateTaxes() {
    // calculate the user's taxes based on their income, investment earnings, dividends, capital gains, etc.
  }

  // // //
  // Functions for operating on the account objects
  // // //

  function calculate() {
    // constructTimeline();
    // For all dates in timeline in order {
      // Calculate interest/ accruals on all financialObjects
      // Clear all scheduled transactions
    // }
    // Push a row into the dataTable if necessary
  }


  // // //
  // Supporting functions.
  // // //

  function validateName(inputName) {
    return (typeof inputName === "string");
  }

  function validateInitialValue(inputInitialValue) {
    return (typeof inputInitialValue === "number");
  }

  function validateAccrualRate(inputAccrualRate) {
    return (typeof inputAccrualRate === "number");
  }

  function validateSubType(inputSubType) {
    return (typeof inputSubType === "string");
  }

  function validateFinancialObject(inputObject) {
    return ((inputObject instanceof FinancialObject) || (inputObject === "external"));
  }

  function validateValueFunction(inputFunction) {
    if (typeof inputFunction !== 'function') {
      return false;
    } else if (typeof inputFunction() !== "number") {
      return false;
    } else {
      return true;
    }
  }

  function validateDate(inputDate) {
    if (inputDate) {
      return inputDate.isValid();
    } else {
      return false;
    }
  }

  function validateFrequency(inputFrequency) {
    return (validFrequencies.indexOf(inputFrequency) !== -1);
  }

  function validateFromAccountStartDate(fromAccountDate, toAccountDate) {
    if (validateDate(fromAccountDate) && validateDate(toAccountDate)) {
      return (toAccountDate.isSameOrAfter(fromAccountDate, 'days')); // We expect the fromAccount to exist at lest one day prior to the toAccount
    }
    return false;
  }

  //----------------------------------------------------------------------------------------
  // Borrowed from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  //----------------------------------------------------------------------------------------
  function generateUUID() {
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      return uuid;
  }

  // Return the public objects and functions.
  PersonalFinanceEngine.modelParameters = modelParameters;
  PersonalFinanceEngine.setUserSelectedEndDate = setUserSelectedEndDate;
  PersonalFinanceEngine.deleteUserSelectedEndDate = deleteUserSelectedEndDate;
  PersonalFinanceEngine.locale = locale;
  PersonalFinanceEngine.personalDetails = personalDetails;
  PersonalFinanceEngine.chequingAccount = chequingAccount;
  PersonalFinanceEngine.assets = assets;
  PersonalFinanceEngine.investmentAccounts = investmentAccounts;
  PersonalFinanceEngine.debtAccounts = debtAccounts;
  PersonalFinanceEngine.createAsset = createAsset;
  PersonalFinanceEngine.editAsset = editAsset;
  PersonalFinanceEngine.deleteAsset = deleteAsset;
  PersonalFinanceEngine.createInvestment = createInvestment;
  PersonalFinanceEngine.editInvestment = editInvestment;
  PersonalFinanceEngine.deleteInvestment = deleteInvestment;
  PersonalFinanceEngine.createDebt = createDebt;
  PersonalFinanceEngine.editDebt = editDebt;
  PersonalFinanceEngine.deleteDebt = deleteDebt;
  PersonalFinanceEngine.transfer = transfer;
  PersonalFinanceEngine.createOneTimeTransfer = createOneTimeTransfer;
  PersonalFinanceEngine.editOneTimeTransfer = editOneTimeTransfer;
  PersonalFinanceEngine.createRecurringTransfer = createRecurringTransfer;
  PersonalFinanceEngine.editRecurringTransfer = editRecurringTransfer;
  PersonalFinanceEngine.deleteTransfer = deleteTransfer;
  PersonalFinanceEngine.calculate = calculate;


  //** PersonalFinanceEngine FOR TEST **/
  var __test__ = {};
  __test__.FinancialObject = FinancialObject;
  __test__.Asset = Asset;
  __test__.FinancialAccount = FinancialAccount;
  __test__.ChequingAccount = ChequingAccount;
  __test__.InvestmentAccount = InvestmentAccount;
  __test__.DebtAccount = DebtAccount;
  __test__.timeline = timeline;
  __test__.TransferDefinition = TransferDefinition;
  __test__.OneTimeTransferDefinition = OneTimeTransferDefinition;
  __test__.RecurringTransferDefinition = RecurringTransferDefinition;
  __test__.constructTimeline = constructTimeline;
  __test__.transferDefinitions = transferDefinitions;
  __test__.getTaxModel = getTaxModel;
  __test__.calculateTaxes = calculateTaxes;
  __test__.findMinDate = findMinDate;
  __test__.findMaxDate =findMaxDate;
  __test__.generateUUID = generateUUID;
  PersonalFinanceEngine.__test__ = __test__;
  //** END PersonalFinanceEngine FOR TEST **//

  return PersonalFinanceEngine;
}));
