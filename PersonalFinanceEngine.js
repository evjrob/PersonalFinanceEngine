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

  // Define the PersonalFinanceEngine Object for revealing only the things we want to
  var PersonalFinanceEngine = {};

  // An assortment of parameters that play an important role throughout the model.
  var modelParameters = {
    timelineStartDate: new moment(),
    timelineEndDate: new moment(),
    userHasSelectedEndDate: false,
    userSelectedEndDate: new moment(),
    dataTableRecordFrequency: "Annually",
    inflation: 0,
  };

  // Parameters specifically related to the user's governmental location for
  // purpose of determining taxation.
  var locale = {
    country: "None",
    subdivision: "None"
  };

  // An object to store user information independednt of their location or the model parameters.
  var personalDetails = {
    familyStatus: "single",   // Relationship status
    dependentList: [],        // A list of dependents (children, infirm relatives, etc.)
    salary: 0,                // Direct income from an external source
    spouseSalary: 0,          // Spousal direct salary, if one exists
    spouseDisability: false,  // Whether
    salaryGrowth: 0,          // Expected annual salary increases as a fraction (eh 5% = 0.05)
    retirementDate: null,     // Planned retirement date. Null = no retirement planned
    retirementIncome: 0.5,    // Percentage of working age salary to be drawn as retirement income
    netWorthSeries: [],       // A table to store personal net worth for charting purposes.
  };

  // The user's primary account. Largely serves as a place for salary or other income to be deposited
  // and as a source for asset purchases, contributions to investments, or payments to debts.
  var chequingAccount = new ChequingAccount({
    ID: "1",
    name: "Test",
    startDate: modelParameters.timelineStartDate, //SHould it be this date or should it be the present date? Historical transfers woul require not preset.
    initialValue: 0,  // Start balance of $0
    accrualRate: 0 // With a negative accrual weight (depreciation) of 5% annually.
  });

  var assets = {};            // Object map of assets that can appreciate or depreciate like a car or house, etc.
  var investmentAccounts = {};// Object map for investment financial accounts like RRSP, TFSA, etc.
  var debtAccounts = {};      // Object map like mortgage (tied to the house asset), loans, etc.

  // A map of all the transfer definitions created by the user and by the initial value transfers for the
  // different financial objects the user has created.
  var transferDefinitions = {};

  // Use a "transactional timeline" model for the financial accounts
  // for key dates in timeline, complete transfers, and record object
  // balances and other figures in correct tables if it's a scheduled task.
  var timeline = {}; // The internal timeline built by constructTimeline() and used by calculate()
  var timelineDates = [];
  var timelineDateFormat = "YYYY-MM-DD";

  // A map of the currently loaded tax models based on the locales the user has selected.
  var taxModels = {
    None: {
      calculateTaxTable: function() {
        return 0;
      },
      getTaxRate: function(financialObject) {
        return taxTable;
      },
      assetConstructor: Asset,
      investmentConstructor: InvestmentAccount,
      debtConstructor: DebtAccount,
    },
  };

  // A variable that stores a function for calculating taxation data tables for whatever
  // locale the user has selected.
  var calculateTaxTable = taxModels["None"].calculateTaxTable;

  // A place to store the taxData for the currently selected locale.
  var taxData;

  // An object map to store the tax data for the different types of financial objects and income
  // the user might possess or earn.
  var taxTable = calculateTaxTable();

  // A function that uses the current tax table to find the appropriate rate for the passed financial object
  var getTaxRate = taxModels["None"].getTaxRate;

  // Variables to store references to the current locales constructors for easy access without
  // constantly retrieving it from the taxModel map.
  var AssetConstructor = taxModels["None"].assetConstructor;
  var InvestmentConstructor = taxModels["None"].investmentConstructor;
  var DebtConstructor = taxModels["None"].debtConstructor;

  // A list of valid relationship statuses that the user can select.
  var validFamilyStatuses = ["Single", "Married"];

  // A list of valid time frequencies the user can select from.
  var validFrequencies = ["Annually", "Semiannually", "Quarterly", "Monthly", "Biweekly", "Weekly"];

  // A map of model frequencies to the corresponding nominal interval and number fof them required
  // in the moment.js library. This is required to have frequencies like "Semiannually" which are
  // not included nominally in moment.js.
  var momentIntervalLookup = {
    "Annually": {interval: "years", singularInterval: "year", multiplier: 1},
    "Semiannually": {interval: "quarters", singularInterval: "quarter", multiplier: 2},
    "Quarterly": {interval: "quarters", singularInterval: "quarter", multiplier: 1},
    "Monthly": {interval: "months", singularInterval: "month", multiplier: 1},
    "Biweekly": {interval: "weeks", singularInterval: "week", multiplier: 2},
    "Weekly": {interval: "weeks", singularInterval: "week", multiplier: 1},
  }


  // A collecton of arrays and objects for storing and mapping the available
  // country level locale information.
  var validCountries = ["None"];
  var countryDetailsPath = "taxes/countryList.json";
  var countryDetails = {
    None: {
      "hasBeenLoaded": true,
      "taxModel": "None",
      "taxData": {}
    },
    Canada:{
      "taxModel": "Canada",
      "hasBeenLoaded": false,
      "taxModelFile": "taxes/taxModels/canada.js",
      "taxDataFile": "taxes/canada/taxData.json",
      "federalSubdivisionsFile": "taxes/canada/provinceList.json",
      "federalSubdivisionWord": "Province"
    }
  };

  validCountries = Object.keys(countryDetails);

  // Need to make it so that this doesn't overwrite the existing hard coded countryDetails,
  // or make it so the hardcoded list isn't necessary:

  // Populate the countryDetails using the JSON file
  //makeRequest({
  //  method: 'GET',
  //  url: countryDetailsPath
  //})
  //.then( function(datums) {
  //  countryDetails = JSON.parse(datums);
  //  validCountries = Object.keys(countryDetails);
  //})
  //.catch(function (err) {
  //  console.error("Error loading Countries for local purposes: "+err.statusText);
  //});


  // A collecton of arrays and objects for storing and mapping the available
  // federal subdivision (province, state, etc) level locale information.
  var validSubdivisions = ["None"];
  var subdivisionDetailsPath = "";
  var subdivisionDetails = {
    "None": {
      "None": {
        "hasBeenLoaded": true,
        "taxModel": "None",
        "taxData": {}
      }
    },
  };

  // Custom Error type for invalid input to the various create and edit functions
  function InvalidInputError(msg, failedInputs) {
    var err = Error.call(this, msg);
    err.name = "InvalidInputError";
    err.failedInputs = failedInputs;
    return err;
  };

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

  // xhr request function shamelessly borrowed from stackoverflow:
  // https://stackoverflow.com/questions/30008114/how-do-i-promisify-native-xhr
  function makeRequest (opts) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(opts.method, opts.url);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      if (opts.headers) {
        Object.keys(opts.headers).forEach(function (key) {
          xhr.setRequestHeader(key, opts.headers[key]);
        });
      }
      var params = opts.params;
      // We'll need to stringify if we've been given an object
      // If we have a string, this is skipped.
      if (params && typeof params === 'object') {
        params = Object.keys(params).map(function (key) {
          return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }).join('&');
      }
      xhr.send(params);
    });
  }

  // A function to convert javascript date ojects in inputs to moment objects
  function momentifyDates(input) {

    // Ordinary "date" properties
    if ('date' in input) {
      if (moment.isDate(input.date) || moment.isMoment(input.date)) {
        input.date = moment.utc(input.date);
      } else {
        input.date = moment.invalid();
      }
    };

    // startDate properties
    if ('startDate' in input) {
      if (moment.isDate(input.startDate) || moment.isMoment(input.startDate)) {
        input.startDate = moment.utc(input.startDate);
      } else {
        input.startDate = moment.invalid();
      }
    };

    // endDate properties
    if ('endDate' in input) {
      if (moment.isDate(input.endDate) || moment.isMoment(input.endDate)) {
        input.endDate = moment.utc(input.endDate);
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


  // // //
  // getValid...() functions.
  //
  // An assortment of functions that determine and return dynamic lists of valid
  // values for user inputs.
  // // //

  // Return a copy of the internal validCountries array.
  function getValidCountries() {
    var newArray = validCountries.slice();
    return newArray;
  }

  // Return a copy of the internal validCountries array.
  function getValidFederalSubdivisions() {
    var newArray = validSubdivisions.slice();
    return newArray;
  }

  // Return a copy of the internal validCountries array.
  function getValidFrequencies() {
    var newArray = validFrequencies.slice();
    return newArray;
  }


  // // //
  //  Functions that are for setting and managing some of the main model components
  //  such as the range of dates the model calculates over, or the locale.
  // // //

  function setUserSelectedEndDate(inputDate) {

    var inputWrapper = {date: inputDate};
    momentifyDates(inputWrapper);

    return new Promise( function (resolve, reject) {
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
  }

  function deleteUserSelectedEndDate() {

    return new Promise( function (resolve, reject) {
      modelParameters.userHasSelectedEndDate = false;
      modelParameters.timelineEndDate = findMaxDate();

      resolve();
    });
  }

  // A function to set the frequency of dataTable recording to one in the momentIntervalLookup
  function setDataTableRecordFrequency(inputFrequency) {

    return new Promise( function (resolve, reject) {

      // If it's a valid frequency (except weekly or biweekly: they don't
      // play well with years for tax purposes)
      if (validateFrequency(inputFrequency) && inputFrequency !== "Weekly" && inputFrequency !== "Biweekly") {

        modelParameters.dataTableRecordFrequency = inputFrequency;

        resolve();
      } else {

        var err = new InvalidInputError("Inputs failed validation", {frequency: true});
        reject(err);
      }
    });
  }

  function setCountry(inputCountry) {

    var thiscountryDetailsEntry = countryDetails[inputCountry];

    return new Promise( function (resolve, reject) {

      if (!validateCountry(inputCountry)) {
        var err = new InvalidInputError("Inputs failed validation", {country: true});
        reject(err);
      }

      // If this country hasn't been selected yet, we still need to load its subdivisions
      // from the json file.
      // I dislike this nested promise approach: it works for now, but needs review.
      if (!thiscountryDetailsEntry.hasBeenLoaded) {
        subdivisionDetailsPath = thiscountryDetailsEntry.federalSubdivisionsFile;
        var taxModelPath = thiscountryDetailsEntry.taxModelFile;
        var taxDataPath = thiscountryDetailsEntry.taxDataFile;

        var dataRequests = [];

        // Populate the validSubdivisions List using the JSON file
        var subdivRequest = makeRequest({
          method: 'GET',
          url: subdivisionDetailsPath
        })
        dataRequests.push(subdivRequest);
        var taxDataRequest = makeRequest({
          method: 'GET',
          url: taxDataPath
        })
        dataRequests.push(taxDataRequest);

        // Resolve when the above requests all finish
        Promise.all([subdivRequest, taxDataRequest])
        .then( function(datums) {
          thiscountryDetailsEntry.hasBeenLoaded = true;

          // Populate the subdivisionDetails and validSubdivisions array.
          subdivisionDetails[inputCountry] = JSON.parse(datums[0]);
          validSubdivisions = Object.keys(subdivisionDetails[inputCountry]);

          // Populate the country taxData.
          thiscountryDetailsEntry.taxData = JSON.parse(datums[1]);

          locale.country = inputCountry;

          // If the current subdivision isn't valid anymore then we need to
          // default to the first one in the validSubdivisions.
          if (!validateFederalSubdivision(locale.subdivision)) {
            setFederalSubdivision(validSubdivisions[0])
            resolve(setFederalSubdivision(validSubdivisions[0]));
          } else {
            resolve();
          }
        })
        .catch(function (err) {
          console.error("Error could not load country json file: "+err.statusText);
          reject(err);
        })
      } else {
        validSubdivisions = Object.keys(subdivisionDetails[inputCountry]);
        locale.country = inputCountry;
        resolve();
      }
    })
  }

  function setFederalSubdivision(inputSubdivision) {

    var subdivisionDetailsEntry = subdivisionDetails[locale.country][inputSubdivision];

    return new Promise( function (resolve, reject) {

      if (validateFederalSubdivision(inputSubdivision)) {

        if (!subdivisionDetailsEntry.hasBeenLoaded) {
          var taxModelPath = subdivisionDetailsEntry.taxModelFile;
          var taxDataPath = subdivisionDetailsEntry.taxDataFile;

          var dataRequests = [];

          // We've never loaded this subdivision, so we definitely need the taxData.
          var taxDataRequest = makeRequest({
            method: 'GET',
            url: taxDataPath
          })
          dataRequests.push(taxDataRequest);

          // If we don't already have it, populate the taxModel using the JS file
          if (!taxModels[subdivisionDetailsEntry.taxModel]) {
            var taxModelRequest = makeRequest({
              method: 'GET',
              url: taxModelPath
            })

            dataRequests.push(taxModelRequest);
          }

          // Resolve when the above requests all finish
          Promise.all(dataRequests)
          .then( function(datums) {
            subdivisionDetailsEntry.hasBeenLoaded = true;

            // Populate the subdivision taxData.
            subdivisionDetailsEntry.taxData = JSON.parse(datums[0]);

            // If the taxModel was also new, then evaluate t to have it configured.
            if (datums.length > 1) {
              eval(datums[1]);
            }

            resolve();
          })
          .catch(function (err) {
            console.error("Error could not load federal subdivision json file: "+err.statusText);
            reject(err);
          })
        } else {
          resolve();
        }
      } else {
        var err = new InvalidInputError("Inputs failed validation", {subdivision: true});
        reject(err);
      }
    })
    .then( function() {
      locale.subdivision = inputSubdivision;
    })
  }


  // // //
  //  Constructors and functions for creating and managing the financial objects
  //  that define a user's accounts, debts, and assets.
  // // //

  // Constructors for the parent Financial Object type and it's child types.
  // An init object passed to it to provide the values for initialization
  // These functions are private as a helper function for each is ecxpected to
  // sanitize user inputs first.
  function FinancialObject(init) {
    this.inputs = init;                   // A copy of teh provided inputs to be used later as needed.
    this.ID = init.ID;
    this.name = init.name;
    this.fromAccount = init.fromAccount;
    this.startDate = init.startDate;      // The startDate for when the initialValue object should clear on the timeline.
    this.initialValue = init.initialValue;
    this.initialTransferID = "",
    this.value = 0;                       // The value is zero until the initialValue object on the timeline creates the principal
    this.accrualRate = init.accrualRate;  // The annual accrual rate of interest or appreciation or depreciation.
    this.currentPeriodNetAccruals = 0;    // The realized accruals that have occured this recording period.
    this.currentYearNetAccruals = 0;      // The accruals for this calendar year (for tax purposes if positive)
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

    return new Promise( function (resolve, reject) {

      var validationPassed = true;
      var failedInputs = {
        name: false,
        subType: false,
        startDate: false,
        fromAccount: false,
        initialValue: false,
        accrualRate: false,
      };

      validationPassed = validateAllFinancialInputs(inputAsset, failedInputs);

      if (validationPassed) {

        var assetID = generateUUID();
        inputAsset.ID = assetID;
        var asset = new AssetConstructor(inputAsset);
        assets[assetID] = asset;

        var initialTransfer = {
          fromAccount: assets[assetID].fromAccount,
          toAccount: assets[assetID],
          valueFunction: function(){return asset.initialValue;},
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
  };

  // TODO:  Figure out what to do with any existing transfer definitions that get buggered up if the startDate for the
  //        editted asset gets moved to a startDate later than some or even all of these transfers. Maybe break the link
  //        and set the transfer fromAccount to external, or maybe set the transfer's new date to the startDate of this account?
  function editAsset(assetID, inputAsset) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(inputAsset);

    return new Promise( function (resolve, reject) {
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

      validationPassed = validateAllFinancialInputs(inputAsset, failedInputs);

      if (validationPassed) {

        inputAsset.ID = assetID;
        var tempInitialTransferID = assets[assetID].initialTransferID;
        var tempAssociatedTransfers = assets[assetID].associatedTransfers;
        var asset = new AssetConstructor(inputAsset);
        assets[assetID] = asset;
        assets[assetID].initialTransferID = tempInitialTransferID;
        assets[assetID].associatedTransfers = tempAssociatedTransfers;

        var initialTransfer = {
          fromAccount: assets[assetID].fromAccount,
          toAccount: assets[assetID],
          valueFunction: function(){return asset.initialValue;},
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

    return new Promise( function (resolve, reject) {
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

      validationPassed = validateAllFinancialInputs(inputInvestment, failedInputs);

      if (validationPassed) {

        var investmentID = generateUUID();
        inputInvestment.ID = investmentID;
        var investment = new InvestmentConstructor(inputInvestment);
        investmentAccounts[investmentID] = investment;

        var initialTransfer = {
          fromAccount: investmentAccounts[investmentID].fromAccount,
          toAccount: investmentAccounts[investmentID],
          valueFunction: function(){return investment.initialValue;},
          date: investmentAccounts[investmentID].startDate,
        };

        var accrualTransfer = {
          fromAccount: "external",
          toAccount: investmentAccounts[investmentID],
          valueFunction: function(){
            var amount = investment['accrualBuffer'];
            investment.accrualBuffer = 0;
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
  };

  function editInvestment(investmentID, inputInvestment) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(inputInvestment);

    return new Promise( function (resolve, reject) {
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

      validationPassed = validateAllFinancialInputs(inputInvestment, failedInputs);

      if (validationPassed) {

        inputInvestment.ID = investmentID;
        var tempInitialTransferID = investmentAccounts[investmentID].initialTransferID;
        var tempAccrualTransferID = investmentAccounts[investmentID].accrualTransferID;
        var tempAssociatedTransfers = investmentAccounts[investmentID].associatedTransfers;
        var investment = new InvestmentConstructor(inputInvestment);
        investmentAccounts[investmentID] = investment;
        investmentAccounts[investmentID].initialTransferID = tempInitialTransferID;
        investmentAccounts[investmentID].accrualTransferID = tempAccrualTransferID;
        investmentAccounts[investmentID].associatedTransfers = tempAssociatedTransfers;

        var initialTransfer = {
          fromAccount: investmentAccounts[investmentID].fromAccount,
          toAccount: investmentAccounts[investmentID],
          valueFunction: function(){return investment.initialValue;},
          date: investmentAccounts[investmentID].startDate,
        };

        var accrualTransfer = {
          fromAccount: "external",
          toAccount: investmentAccounts[investmentID],
          valueFunction: function(){
            var amount = investment['accrualBuffer'];
            investment.accrualBuffer = 0;
            return amount;
          },
          startDate: investmentAccounts[investmentID].startDate,
          frequency: investmentAccounts[investmentID].accrualPaymentFrequency,
        };

        editOneTimeTransfer(investmentAccounts[investmentID].initialTransferID, initialTransfer)
          .then(function (returnID) {
            return editRecurringTransfer(investmentAccounts[investmentID].accrualTransferID, accrualTransfer);
          })
          .then(function (returnID) {
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

    return new Promise( function (resolve, reject) {
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

      validationPassed = validateAllFinancialInputs(inputDebt, failedInputs);

      if (validationPassed) {

        var debtID = generateUUID();
        inputDebt.ID = debtID;
        var debt = new DebtConstructor(inputDebt);
        debtAccounts[debtID] = debt;

        var initialTransfer = {
          fromAccount: debtAccounts[debtID].fromAccount,
          toAccount: debtAccounts[debtID],
          valueFunction: function(){return debt.initialValue;},
          date: debtAccounts[debtID].startDate,
        };

        var accrualTransfer = {
          fromAccount: "external",
          toAccount: debtAccounts[debtID],
          valueFunction: function(){
            var amount = debt['accrualBuffer'];
            debt.accrualBuffer = 0;
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
  };

  function editDebt(debtID, inputDebt) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(inputDebt);

    return new Promise( function (resolve, reject) {
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

      validationPassed = validateAllFinancialInputs(inputDebt, failedInputs);

      if (validationPassed) {

        inputDebt.ID = debtID;
        var tempInitialTransferID = debtAccounts[debtID].initialTransferID;
        var tempAccrualTransferID = debtAccounts[debtID].accrualTransferID;
        var tempAssociatedTransfers = debtAccounts[debtID].associatedTransfers;
        var debt = new DebtConstructor(inputDebt);
        debtAccounts[debtID] = debt;
        debtAccounts[debtID].initialTransferID = tempInitialTransferID;
        debtAccounts[debtID].accrualTransferID = tempAccrualTransferID;
        debtAccounts[debtID].associatedTransfers = tempAssociatedTransfers;

        var initialTransfer = {
          fromAccount: debtAccounts[debtID].fromAccount,
          toAccount: debtAccounts[debtID],
          valueFunction: function(){return debt.initialValue;},
          date: debtAccounts[debtID].startDate,
        };

        var accrualTransfer = {
          fromAccount: "external",
          toAccount: debtAccounts[debtID],
          valueFunction: function(){
            var amount = debt['accrualBuffer'];
            debt.accrualBuffer = 0;
            return amount;
          },
          startDate: debtAccounts[debtID].startDate,
          frequency: debtAccounts[debtID].accrualPaymentFrequency,
        };

        editOneTimeTransfer(debtAccounts[debtID].initialTransferID, initialTransfer)
          .then( function () {
            return editRecurringTransfer(debtAccounts[debtID].accrualTransferID, accrualTransfer);
          })
          .then(function (returnID) {
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
  };

  function deleteDebt(debtID) {
    // Delete the Debt with the provided UUID.
    var promise = deleteFinancialObject(debtID, debtAccounts);
    return promise;
  };

  // A function to delete any FinancialObject. Currenty exposed through the
  // individual Asset, Investment, Debt functions for function naming consistency.
  function deleteFinancialObject(UUID, storageMap) {

    return new Promise( function (resolve, reject) {
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
  };


  // // //
  //  Constructors and functions for creating and managing the transfer definitions
  //  that define the movement of money between the user's financial accounts and
  //  assets, and to and from an external sources.
  // // //

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

  // Methods to set and change user defined transfers.
  function createOneTimeTransfer(newTransfer) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(newTransfer);

    return new Promise( function (resolve, reject) {

      var validationPassed = true;
      var failedInputs = {
        fromAccount: false,
        toAccount: false,
        valueFunction: false,
        date: false
      };

      validationPassed = validateAllTransferInputs(newTransfer, failedInputs);

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
  };
  function editOneTimeTransfer(transferID, newTransfer) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(newTransfer);

    return new Promise( function (resolve, reject) {

      var validationPassed = true;
      var failedInputs = {
        fromAccount: false,
        toAccount: false,
        valueFunction: false,
        date: false
      };

      validationPassed = validateAllTransferInputs(newTransfer, failedInputs);

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
  };
  function createRecurringTransfer(newTransfer) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(newTransfer);

    return new Promise( function (resolve, reject) {

      var validationPassed = true;
      var failedInputs = {
        fromAccount: false,
        toAccount: false,
        valueFunction: false,
        startDate: false,
        endDate: false,
        frequency: false,
      };

      validationPassed = validateAllTransferInputs(newTransfer, failedInputs);

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

      };
    });
  };
  function editRecurringTransfer(transferID, newTransfer) {

    //convert the user provided native Date objects to moment objects
    momentifyDates(newTransfer);

    return new Promise( function (resolve, reject) {

      var validationPassed = true;
      var failedInputs = {
        fromAccount: false,
        toAccount: false,
        valueFunction: false,
        startDate: false,
        endDate: false,
        frequency: false,
      };

      validationPassed = validateAllTransferInputs(newTransfer, failedInputs);

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
  };
  function deleteTransfer(transferID) {

    return new Promise( function (resolve, reject) {
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
  };

  // A transfer method to transfer funds from account1 to account2
  // All changes to the value of an account should occur
  // through a transfer. External accounts are denoted as "external"
  // in place of the usua UUID.
  function transfer(fromAccount, toAccount, transferAmount) {
    if (fromAccount !== "external") {
      fromAccount.value -= transferAmount;
    }
    if (toAccount !== "external")  {
      toAccount.value += transferAmount;
    }
  }


  // // //
  //  Functions pertaining to the main calculations the model performs.
  // // //

  function constructTimeline() {

    // Reset the timeline
    PersonalFinanceEngine.timeline = {};

    // Get the minimum and maximum dates to populate over
    var minDate = modelParameters.timelineStartDate;
    var maxDate = modelParameters.timelineEndDate;

    // Fill in date entries for important recording dates:
    // Start wth our timelineStartDate and timelineEndDate
    if (!timeline[minDate.format(timelineDateFormat)]) {
      timeline[minDate.format(timelineDateFormat)] = {
        recordThisDate: true,
        transfers: [],
      };
    } else {
      timeline[minDate.format(timelineDateFormat)].recordThisDate = true;
    }

    if (!timeline[maxDate.format(timelineDateFormat)]) {
      timeline[maxDate.format(timelineDateFormat)] = {
        recordThisDate: true,
        transfers: [],
      };
    } else {
      timeline[maxDate.format(timelineDateFormat)].recordThisDate = true;
    }

    // And reguar points in between like the end of the month or december 31st, important tax dates, etc.
    var momentInterval = momentIntervalLookup[PersonalFinanceEngine.modelParameters.dataTableRecordFrequency].interval;
    var singularInterval = momentIntervalLookup[PersonalFinanceEngine.modelParameters.dataTableRecordFrequency].singularInterval;
    var multiplier = momentIntervalLookup[PersonalFinanceEngine.modelParameters.dataTableRecordFrequency].multiplier;

    for (var i = 0; i <= maxDate.diff(minDate, momentInterval)/multiplier; i++) {

      // Make a moment object for this key date
      var keyDate = moment(minDate).add(i*multiplier, momentInterval).endOf(singularInterval);

      // Create the timeline date if it does not already exist
      if (!timeline[keyDate.format(timelineDateFormat)]) {
        timeline[keyDate.format(timelineDateFormat)] = {
          recordThisDate: true,
          transfers: [],
        };
      } else {
        timeline[keyDate.format(timelineDateFormat)].recordThisDate = true;
      }
    }

    // Now for the transfers themselves:
    // Regular and onetime transfers that occur between min and max dates including contributions and interest deposits, etc.
    for (var transferID in transferDefinitions) {
      // Get the ref instead of addressing the property repeatedly
      var currentTransferDef = transferDefinitions[transferID];

      // Place the transfer functions into to the timeline for this definition.
      if (currentTransferDef.type === "OneTime") {

        // Only add dates that are between the timelineStartDate and timelineEndDate
        if (currentTransferDef.date.isSameOrAfter(minDate) && currentTransferDef.date.isSameOrBefore(maxDate)) {
          // Create the timeline date if it does not already exist
          if (!timeline[currentTransferDef.date.format(timelineDateFormat)]) {
            timeline[currentTransferDef.date.format(timelineDateFormat)] = {
              recordThisDate: false,
              transfers: [],
            };
          }

          // Append this transfer defiition's value function
          timeline[currentTransferDef.date.format(timelineDateFormat)].transfers.push({
            fromAccount: currentTransferDef.fromAccount,
            toAccount: currentTransferDef.toAccount,
            valueFunction: currentTransferDef.valueFunction
          });
        }

      } else if (currentTransferDef.type === "Recurring") {

        // Only add dates that are between the timelineStartDate and timelineEndDate
        if (currentTransferDef.startDate.isSameOrAfter(minDate) && currentTransferDef.startDate.isSameOrBefore(maxDate)) {

          // If the recurring transfer has an end date before timelineEndDate we'll use that
          var currentEndDate;
          if (currentTransferDef.endDate) {
            currentEndDate = moment.min(maxDate, currentTransferDef.endDate);
          } else {
            currentEndDate = maxDate;
          }

          var momentInterval = momentIntervalLookup[currentTransferDef.frequency].interval;
          var multiplier = momentIntervalLookup[currentTransferDef.frequency].multiplier;

          // Iterate over the interval
          for (var i = 0; i <= currentEndDate.diff(currentTransferDef.startDate, momentInterval)/multiplier; i++) {

            // Make a moment object for this key date
            var keyDate = moment(currentTransferDef.startDate).add(i*multiplier, momentInterval);

            // Create the timeline date if it does not already exist
            if (!timeline[keyDate.format(timelineDateFormat)]) {
              timeline[keyDate.format(timelineDateFormat)] = {
                recordThisDate: false,
                transfers: [],
              };
            }

            // Append this transfer defiition's value function
            timeline[keyDate.format(timelineDateFormat)].transfers.push({
              fromAccount: currentTransferDef.fromAccount,
              toAccount: currentTransferDef.toAccount,
              valueFunction: currentTransferDef.valueFunction
            });
          }
        }
      }
    }
  }

  function getTaxModel() {
    // Using the user's locale information determine the appropriate
    // tax model, and fetch the associated .json ans .js files if necessary
    // then put them into the taxModels object.


  }

  function applyTaxModel(modelName) {
    // Apply associated taxModel components to calculateTaxTable(), and getTaxRate();
    // Also the constructors.
  }

  function calculate() {

    constructTimeline();

    return new Promise( function (resolve, reject) {

      // reset all of the properties of the financialObjects
      for (var assetID in assets) {
        assets[assetID].value = 0;
        assets[assetID].currentPeriodNetAccruals = 0;
        assets[assetID].dataTable = [];
      }

      for (var investmentID in investmentAccounts) {
        investmentAccounts[investmentID].value = 0;
        investmentAccounts[investmentID].currentPeriodNetAccruals = 0;
        investmentAccounts[investmentID].accrualBuffer = 0;
        investmentAccounts[investmentID].dataTable = [];
      }

      for (var debtID in debtAccounts) {
        debtAccounts[debtID].value = 0;
        debtAccounts[debtID].currentPeriodNetAccruals = 0;
        debtAccounts[debtID].accrualBuffer = 0;
        debtAccounts[debtID].dataTable = [];
      }

      // Turn the properties of the timeline into an array of date strings
      var dates = Object.keys(timeline);

      // Sort the dates by comparing the getTime() values of their respective Date() objects.
      dates.sort( function(a,b) {
        return moment(a).isAfter(moment(b));
      })

      // For all dates in sorted order:
      var keyDateCount = dates.length;
      for (var i = 0; i < keyDateCount; i++) {

        var thisDateString = dates[i];
        var thisDate = moment.utc(dates[i]);
        var lastDate;

        if (i !== 0) {
          lastDate = moment.utc(dates[i-1]);
        } else {
          lastDate = moment.utc(dates[i]);
        }

        var daysElapsed = thisDate.diff(lastDate, "days");

        // Calculate accruals using standard daily compounding interest formula
        // for each financial object we have in assets, investmentAccounts, debtAccounts:
        // Daily interest is always assumed to be for a 365 day year. February 29th is a freebie.
        if (thisDate.isSameOrBefore(modelParameters.timelineEndDate)) { // Only consider dates that are before our timelineEndDate
          for (var assetID in assets) {
            var accrualRate = assets[assetID].accrualRate;
            var principal = assets[assetID].value;
            var newValue = principal*Math.pow((1+(accrualRate/365)), daysElapsed);
            var accrual = newValue - principal;
            assets[assetID].currentPeriodNetAccruals = newValue;
            assets[assetID].value += accrual; // assets don't get deposited interest, they implicitly appreciate or depreciate
          }

          for (var investmentID in investmentAccounts) {
            var accrualRate = investmentAccounts[investmentID].accrualRate;
            var principal = investmentAccounts[investmentID].value + investmentAccounts[investmentID].accrualBuffer;
            var newValue = principal*Math.pow((1+(accrualRate/365)), daysElapsed);
            var accrual = newValue - principal;
            investmentAccounts[investmentID].currentPeriodNetAccruals += accrual;
            investmentAccounts[investmentID].accrualBuffer += accrual; // investments are reliant on the accrualTransfer to deposit interest.
          }

          for (var debtID in debtAccounts) {
            var accrualRate = debtAccounts[debtID].accrualRate;
            var principal = debtAccounts[debtID].value + debtAccounts[debtID].accrualBuffer;
            var newValue = principal*Math.pow((1+(accrualRate/365)), daysElapsed);
            var accrual = newValue - principal;
            debtAccounts[debtID].currentPeriodNetAccruals += accrual;
            debtAccounts[debtID].accrualBuffer += accrual; // debts are reliant on the accrualTransfer to deposit interest.
          }
        }

        // Apply all of the scheduled transactions
        var transferCount = timeline[thisDateString].transfers.length;
        for (var j = 0; j < transferCount; j++) {
          var thisToAccount = timeline[thisDateString].transfers[j].toAccount;
          var thisFromAccount = timeline[thisDateString].transfers[j].fromAccount;
          var thisTransferAmount = timeline[thisDateString].transfers[j].valueFunction();

          // A debt shouldnt be overpaid:
          // See if there isn't a better place than here to accomplish this?
          if (thisToAccount.type === "Debt") {
            var outstandingDebt = thisToAccount.value + thisToAccount.accrualBuffer;

            // Check that the outstanding debt is below zero and if the size of the transfer exceeds the debt
            if ((outstandingDebt <= 0) && (thisTransferAmount > -1*outstandingDebt)) {
              // Set the transfer to the outstanding debt value.
              thisTransferAmount = -1*outstandingDebt;
            }
          }

          transfer(thisFromAccount, thisToAccount, thisTransferAmount);
        }

        // Push a row into the dataTable of each financal object if necessary
        if (timeline[thisDateString].recordThisDate) {
          for (var assetID in assets) {
            var thisValue = assets[assetID].value;
            var thisPeriodAccruals = assets[assetID].currentPeriodNetAccruals;
            var thisYearAccruals = assets[assetID].currentYearNetAccruals;
            assets[assetID].dataTable.push({date: thisDate, value: thisValue, periodAccruals: thisPeriodAccruals, yearAccruals: thisYearAccruals});

            // zero out the current accruals
            assets[assetID].currentPeriodNetAccruals = 0;
          }

          for (var investmentID in investmentAccounts) {
            var thisValue = investmentAccounts[investmentID].value;
            var thisPeriodAccruals = investmentAccounts[investmentID].currentPeriodNetAccruals;
            var thisYearAccruals = investmentAccounts[investmentID].currentYearNetAccruals;
            investmentAccounts[investmentID].dataTable.push({date: thisDate, value: thisValue, periodAccruals: thisPeriodAccruals, yearAccruals: thisYearAccruals});

            // zero out the current accruals
            investmentAccounts[investmentID].currentPeriodNetAccruals = 0;
          }

          for (var debtID in debtAccounts) {
            var thisValue = debtAccounts[debtID].value;
            var thisPeriodAccruals = debtAccounts[debtID].currentPeriodNetAccruals;
            var thisYearAccruals = debtAccounts[debtID].currentYearNetAccruals;
            debtAccounts[debtID].dataTable.push({date: thisDate, value: thisValue, periodAccruals: thisPeriodAccruals, yearAccruals: thisYearAccruals});

            // zero out the current accruals
            debtAccounts[debtID].currentPeriodNetAccruals = 0;
          }
        }
      }

      resolve(true);
    });
  }


  // // //
  //  Validation functions for checking user inputs.
  // // //

  // A catch all verification function for financial objects and accounts to reduce code repetition
  // returns a validationPassed (boolean) and acts on the passed failedInputs object to set true for
  // the specific inputObject properties hat failed the validation.
  function validateAllFinancialInputs(inputObject, failedInputs) {

    var validationPassed = true;

    // Checks on input like valid date, valid from / to accounts etc
    if (!validateName(inputObject.name)) {
      validationPassed = false;
      failedInputs.name = true;
    };

    if (!validateSubType(inputObject.subType)) {
      validationPassed = false;
      failedInputs.subType = true;
    };

    if (!validateDate(inputObject.startDate)) {
      validationPassed = false;
      failedInputs.startDate = true;
    };

    if (!validateFinancialObject(inputObject.fromAccount)) {
      validationPassed = false;
      failedInputs.fromAccount = true;
    } else if (inputObject.fromAccount !== "external") {
      if (!validateFromAccountStartDate(inputObject.fromAccount.startDate, inputObject.startDate)) {
        validationPassed = false;
        failedInputs.fromAccount = true;
      }
    };

    if (!validateInitialValue(inputObject.initialValue)) {
      validationPassed = false;
      failedInputs.initialValue = true;
    };

    if (!validateAccrualRate(inputObject.accrualRate)) {
      validationPassed = false;
      failedInputs.accrualRate = true;
    };

    // Check if the following properties are expected in the failedInputs object before validating.
    if ("accrualPaymentFrequency" in failedInputs) {
      if (!validateFrequency(inputObject.accrualPaymentFrequency)) {
        validationPassed = false;
        failedInputs.accrualPaymentFrequency = true;
      };
    }

    return validationPassed;
  }

  // A cacth all verification function for transfer definitions
  // returns a validationPassed (boolean) and acts on the passed failedInputs object to set true for
  // the specific inputObject properties hat failed the validation.
  function validateAllTransferInputs(inputObject, failedInputs) {

    var validationPassed = true;

    // Checks on input like valid date, valid from / to accounts etc
    if (!validateFinancialObject(inputObject.fromAccount)) {
      validationPassed = false;
      failedInputs.fromAccount = true;
    };

    if (!validateFinancialObject(inputObject.toAccount)) {
      validationPassed = false;
      failedInputs.toAccount = true;
    };

    if (!validateAccountsNotBothExternal(inputObject.fromAccount, inputObject.toAccount)) {
      validationPassed = false;
      failedInputs.fromAccount = true;
      failedInputs.toAccount = true;
    }

    if (!validateValueFunction(inputObject.valueFunction)) {
      validationPassed = false;
      failedInputs.valueFunction = true;
    }

    // Check if the following properties are expected in the failedInputs object before validating.
    if ("date" in failedInputs) {
      if (!validateDate(inputObject.date)) {
        validationPassed = false;
        failedInputs.date = true;
      }
    }

    if ("startDate" in failedInputs) {
      if (!validateDate(inputObject.startDate)) {
        validationPassed = false;
        failedInputs.startDate = true;
      }
    }

    if ("endDate" in failedInputs) {
      if ("endDate" in inputObject) {
        if (!validateDate(inputObject.endDate)) {
          validationPassed = false;
          failedInputs.endDate = true;
        }
      }
    }

    if ("frequency" in failedInputs) {
      if (!validateFrequency(inputObject.frequency)) {
        validationPassed = false;
        failedInputs.frequency = true;
      }
    }

    return validationPassed;
  }

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

  function validateAccountsNotBothExternal(fromAccount, toAccount) {
    return !(fromAccount === "external" && toAccount === "external");
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

  function validateCountry(inputCountry) {
    if (validCountries.indexOf(inputCountry) !== -1) {
      return true;
    }
    return false;
  }

  function validateFederalSubdivision(inputSubdivision) {
    if (validSubdivisions.indexOf(inputSubdivision) !== -1) {
      return true;
    }
    return false;
  }

  // Return the public objects and functions.
  PersonalFinanceEngine.modelParameters = modelParameters;
  PersonalFinanceEngine.setUserSelectedEndDate = setUserSelectedEndDate;
  PersonalFinanceEngine.deleteUserSelectedEndDate = deleteUserSelectedEndDate;
  PersonalFinanceEngine.setDataTableRecordFrequency = setDataTableRecordFrequency;
  PersonalFinanceEngine.locale = locale;
  PersonalFinanceEngine.setCountry = setCountry;
  PersonalFinanceEngine.setFederalSubdivision = setFederalSubdivision;
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

  PersonalFinanceEngine.getValidCountries = getValidCountries;
  PersonalFinanceEngine.getValidFederalSubdivisions = getValidFederalSubdivisions;
  PersonalFinanceEngine.getValidFrequencies = getValidFrequencies;

  //** PersonalFinanceEngine FOR TEST **/
  var __test__ = {};
  __test__.countryDetails = countryDetails;
  __test__.subdivisionDetails = subdivisionDetails;
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
  __test__.constructTimeline = constructTimeline.bind(PersonalFinanceEngine);
  __test__.transferDefinitions = transferDefinitions;
  __test__.taxModels = taxModels;
  __test__.getTaxModel = getTaxModel;
  __test__.applyTaxModel = applyTaxModel;
  __test__.calculateTaxTable = calculateTaxTable;
  __test__.findMinDate = findMinDate;
  __test__.findMaxDate =findMaxDate;
  __test__.generateUUID = generateUUID;
  PersonalFinanceEngine.__test__ = __test__;
  //** END PersonalFinanceEngine FOR TEST **//

  return PersonalFinanceEngine;
}));
