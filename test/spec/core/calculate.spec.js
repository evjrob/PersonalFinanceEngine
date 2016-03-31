describe("Calculate functions", function() {

  describe("caclulate()", function() {

    var firstDate = new Date("1970-01-01");
    var secondDate = new Date("1972-06-15");
    var thirdDate = new Date("1975-01-05");

    var assetInput;
    var assetID;
    var investmentInput;
    var investmentID;
    var debtInput;
    var DebtID;
    var transferInput;
    var transferID;

    beforeAll( function(done) {

      investmentInput = {
        name: "InvestmentTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.0,
        accrualPaymentFrequency: "Monthly",
      };

      debtInput = {
        name: "DebtTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.0,
        accrualPaymentFrequency: "Monthly",
      };

      PersonalFinanceEngine.setUserSelectedEndDate(thirdDate)
        .then( function() {
          done();
        })
    });

    afterAll( function(done) {
      PersonalFinanceEngine.deleteUserSelectedEndDate()
        .then( function() {
          done();
        })
    });

    it("should have a calculate method on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.calculate).toEqual(jasmine.any(Function));
    });

    it("should record regular results into the dataTable of each financialObject on an annual basis.", function(done) {
      assetInput = {
        name: "AssetTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.0,
      };

      PersonalFinanceEngine.createAsset(assetInput)
        .then( function(returnID) {
          assetID = returnID;

          return PersonalFinanceEngine.calculate();
        })
        .then( function() {
          expect(PersonalFinanceEngine.assets[assetID].dataTable.length).toBeGreaterThan(0);

          return PersonalFinanceEngine.deleteAsset(assetID);
        })
        .then( function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should apply a one time transfer.", function(done) {
      var expectedTransferAmount = 2000;

      assetInput = {
        name: "AssetTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 0,  // Start balance of $0
        accrualRate: 0.0,
      };

      PersonalFinanceEngine.createAsset(assetInput)
        .then( function(returnID) {
          assetID = returnID;

          transferInput = transferInput = {
            fromAccount: "external",
            toAccount: PersonalFinanceEngine.assets[assetID],
            valueFunction: function(){return expectedTransferAmount;},
            date: secondDate,
          };

          return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
        })
        .then( function(returnID) {
          transferID = returnID;
          return PersonalFinanceEngine.calculate();
        })
        .then( function() {
          var recordedDataPointsCount = PersonalFinanceEngine.assets[assetID].dataTable.length;
          expect(recordedDataPointsCount).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.assets[assetID].dataTable[0]["value"]).toEqual(0);
          expect(PersonalFinanceEngine.assets[assetID].dataTable[recordedDataPointsCount-1]["value"]).toEqual(expectedTransferAmount);

          return PersonalFinanceEngine.deleteAsset(assetID);
        })
        .then( function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should clear a recurring transfer multiple times.", function(done) {
      var expectedTransferAmount = 200;

      assetInput = {
        name: "AssetTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 0,  // Start balance of $0
        accrualRate: 0.0,
      };

      PersonalFinanceEngine.createAsset(assetInput)
        .then( function(returnID) {
          assetID = returnID;

          transferInput = transferInput = {
            fromAccount: "external",
            toAccount: PersonalFinanceEngine.assets[assetID],
            valueFunction: function(){return expectedTransferAmount;},
            startDate: firstDate,
            endDate: secondDate,
            frequency: "Annually",
          };

          return PersonalFinanceEngine.createRecurringTransfer(transferInput);
        })
        .then( function(returnID) {
          transferID = returnID;
          return PersonalFinanceEngine.calculate();
        })
        .then( function() {
          var recordedDataPointsCount = PersonalFinanceEngine.assets[assetID].dataTable.length;
          expect(recordedDataPointsCount).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.assets[assetID].dataTable[0]["value"]).toEqual(expectedTransferAmount);
          expect(PersonalFinanceEngine.assets[assetID].dataTable[recordedDataPointsCount-1]["value"]).toEqual(expectedTransferAmount*3); // 3 years between frst and second date

          return PersonalFinanceEngine.deleteAsset(assetID);
        })
        .then( function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should accumulate accruals as expected for an asset.", function(done) {
      assetInput = {
        name: "AssetTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.1, // 10%
      };

      PersonalFinanceEngine.createAsset(assetInput)
        .then( function(returnID) {
          assetID = returnID;

          // No extra transfers

          return PersonalFinanceEngine.calculate();
        })
        .then( function() {
          var recordedDataPointsCount = PersonalFinanceEngine.assets[assetID].dataTable.length;
          expect(recordedDataPointsCount).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.assets[assetID].dataTable[0]["value"]).toBeCloseTo(1000,8);
          expect(PersonalFinanceEngine.assets[assetID].dataTable[1]["value"]).toBeCloseTo(1000*Math.pow((1+(0.1/365)), 364), 8);
          expect(PersonalFinanceEngine.assets[assetID].dataTable[recordedDataPointsCount-1]["value"]).toBeCloseTo(1000*Math.pow((1+(0.1/365)),1830), 8); // normal compoound interest formula.

          return PersonalFinanceEngine.deleteAsset(assetID);
        })
        .then( function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should accumulate and transfer accruals as expected for an investment.", function(done) {
      investmentInput = {
        name: "InvestmentTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.1, // 10%
        accrualPaymentFrequency: "Monthly",
      };

      PersonalFinanceEngine.createInvestment(investmentInput)
        .then( function(returnID) {
          investmentID = returnID;

          // No extra transfers

          return PersonalFinanceEngine.calculate();
        })
        .then( function() {
          var recordedDataPointsCount = PersonalFinanceEngine.investmentAccounts[investmentID].dataTable.length;
          expect(recordedDataPointsCount).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.investmentAccounts[investmentID].dataTable[0]["value"]).toBeCloseTo(1000,8);

          var yearValue = PersonalFinanceEngine.investmentAccounts[investmentID].dataTable[1]["value"];
          var yearLastTransferMonths = moment("1970-12-31").diff(PersonalFinanceEngine.investmentAccounts[investmentID].startDate, "months");
          var yearLastTransferDate = moment(firstDate).add(yearLastTransferMonths, "months");
          var daysElapsed = yearLastTransferDate.diff(PersonalFinanceEngine.investmentAccounts[investmentID].startDate, "days");
          expect(yearValue).toBeCloseTo(1000*Math.pow((1+(0.1/365)), daysElapsed), 8);

          yearValue = PersonalFinanceEngine.investmentAccounts[investmentID].dataTable[recordedDataPointsCount-1]["value"];
          yearLastTransferMonths = moment(thirdDate).diff(PersonalFinanceEngine.investmentAccounts[investmentID].startDate, "months");
          yearLastTransferDate = moment(firstDate).add(yearLastTransferMonths, "months");
          daysElapsed = yearLastTransferDate.diff(PersonalFinanceEngine.investmentAccounts[investmentID].startDate, "days");
          expect(PersonalFinanceEngine.investmentAccounts[investmentID].dataTable[recordedDataPointsCount-1]["value"]).toBeCloseTo(1000*Math.pow((1+(0.1/365)),daysElapsed), 8); // normal compoound interest formula.

          return PersonalFinanceEngine.deleteInvestment(investmentID);
        })
        .then( function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should accumulate and transfer accruals as expected for a debt.", function(done) {
      debtInput = {
        name: "debtTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: -1000,  // Start balance of minus $1000
        accrualRate: 0.1, // 10%
        accrualPaymentFrequency: "Monthly",
      };

      PersonalFinanceEngine.createDebt(debtInput)
        .then( function(returnID) {
          debtID = returnID;

          // No extra transfers

          return PersonalFinanceEngine.calculate();
        })
        .then( function() {
          var recordedDataPointsCount = PersonalFinanceEngine.debtAccounts[debtID].dataTable.length;
          expect(recordedDataPointsCount).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.debtAccounts[debtID].dataTable[0]["value"]).toBeCloseTo(-1000,8);

          var yearValue = PersonalFinanceEngine.debtAccounts[debtID].dataTable[1]["value"];
          var yearLastTransferMonths = moment("1970-12-31").diff(PersonalFinanceEngine.debtAccounts[debtID].startDate, "months");
          var yearLastTransferDate = moment(firstDate).add(yearLastTransferMonths, "months");
          var daysElapsed = yearLastTransferDate.diff(PersonalFinanceEngine.debtAccounts[debtID].startDate, "days");
          expect(yearValue).toBeCloseTo(-1000*Math.pow((1+(0.1/365)), daysElapsed), 8);

          yearValue = PersonalFinanceEngine.debtAccounts[debtID].dataTable[recordedDataPointsCount-1]["value"];
          yearLastTransferMonths = moment(thirdDate).diff(PersonalFinanceEngine.debtAccounts[debtID].startDate, "months");
          yearLastTransferDate = moment(firstDate).add(yearLastTransferMonths, "months");
          daysElapsed = yearLastTransferDate.diff(PersonalFinanceEngine.debtAccounts[debtID].startDate, "days");
          expect(PersonalFinanceEngine.debtAccounts[debtID].dataTable[recordedDataPointsCount-1]["value"]).toBeCloseTo(-1000*Math.pow((1+(0.1/365)),daysElapsed), 8); // normal compoound interest formula.

          return PersonalFinanceEngine.deleteDebt(debtID);
        })
        .then( function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should not overpay a debt causing a positive balance.", function(done) {
      debtInput = {
        name: "DebtTest1",
        subType: "",
        startDate: firstDate, // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: -1500,  // Start balance of -$1500
        accrualRate: 0.01, // 1% Just to make this a bit of a challenge
        accrualPaymentFrequency: "Monthly",
      };

      PersonalFinanceEngine.createDebt(debtInput)
        .then( function(returnID) {
          debtID = returnID;

          // An indefinite transfer of $200 that is not a nice multiple of the principal (-$1500).
          transferInput = transferInput = {
            fromAccount: "external",
            toAccount: PersonalFinanceEngine.debtAccounts[debtID],
            valueFunction: function(){return 200;},
            startDate: moment(secondDate).add(15, "days"),
            frequency: "Monthly",
          };

          return PersonalFinanceEngine.createRecurringTransfer(transferInput);
        })
        .then( function(returnID) {
          transferID = returnID;

          return PersonalFinanceEngine.calculate();
        })
        .then( function() {
          var recordedDataPointsCount = PersonalFinanceEngine.debtAccounts[debtID].dataTable.length;
          expect(recordedDataPointsCount).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.debtAccounts[debtID].dataTable[0]["value"]).toEqual(-1500);
          expect(PersonalFinanceEngine.debtAccounts[debtID].dataTable[recordedDataPointsCount-1]["value"]).toEqual(0); // normal compoound interest formula.

          return PersonalFinanceEngine.deleteDebt(debtID);
        })
        .then( function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    //it("should calculate interest before transactions and transfers are cleared.", function() {
    //  expect(true).toEqual(false);
    //});

  });

  describe("tax functions", function() {

    it("should have a private getTaxModel method on the __test__ scope", function() {
      expect(PersonalFinanceEngine.__test__.getTaxModel).toBeDefined();
      expect(PersonalFinanceEngine.getTaxModel).not.toBeDefined();
    });

    it("should determine the correct taxModel based on the user's locale when we call getTaxModel", function(done) {
      expect(PersonalFinanceEngine.__test__.getTaxModel()).toEqual("None");

      PersonalFinanceEngine.setCountry("Canada")
        .then(function() {
          expect(PersonalFinanceEngine.__test__.getTaxModel()).toEqual("Canada");

          return PersonalFinanceEngine.setCountry("None");
        })
        .then(function() {
          expect(PersonalFinanceEngine.__test__.getTaxModel()).toEqual("None");

          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should have a private applyTaxModel method on the __test__ scope", function() {
      expect(PersonalFinanceEngine.__test__.applyTaxModel).toBeDefined();
      expect(PersonalFinanceEngine.applyTaxModel).not.toBeDefined();
    });

    it("should load the correct taxModel components when we call applyTaxModel", function(done) {
      expect(PersonalFinanceEngine.__test__.getTaxModel()).toEqual("None");

      PersonalFinanceEngine.setCountry("Canada")
        .then(function() {
          expect(PersonalFinanceEngine.__test__.getTaxModel()).toEqual("Canada");

          expect(PersonalFinanceEngine.__test__.calculateTaxTable).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.calculateTaxTable).toEqual(PersonalFinanceEngine.__test__.taxModels["Canada"].calculateTaxTable);

          expect(PersonalFinanceEngine.__test__.getTaxRate).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.getTaxRate).toEqual(PersonalFinanceEngine.__test__.taxModels["Canada"].getTaxRate);

          expect(PersonalFinanceEngine.__test__.AssetConstructor).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.AssetConstructor).toEqual(PersonalFinanceEngine.__test__.taxModels["Canada"].assetConstructor);

          expect(PersonalFinanceEngine.__test__.InvestmentConstructor).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.InvestmentConstructor).toEqual(PersonalFinanceEngine.__test__.taxModels["Canada"].investmentConstructor);

          expect(PersonalFinanceEngine.__test__.DebtConstructor).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.DebtConstructor).toEqual(PersonalFinanceEngine.__test__.taxModels["Canada"].debtConstructor);

          return PersonalFinanceEngine.setCountry("None");
        })
        .then(function() {
          expect(PersonalFinanceEngine.__test__.getTaxModel()).toEqual("None");

          expect(PersonalFinanceEngine.__test__.calculateTaxTable).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.calculateTaxTable).toEqual(PersonalFinanceEngine.__test__.taxModels["None"].calculateTaxTable);

          expect(PersonalFinanceEngine.__test__.getTaxRate).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.getTaxRate).toEqual(PersonalFinanceEngine.__test__.taxModels["None"].getTaxRate);

          expect(PersonalFinanceEngine.__test__.AssetConstructor).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.AssetConstructor).toEqual(PersonalFinanceEngine.__test__.taxModels["None"].assetConstructor);

          expect(PersonalFinanceEngine.__test__.InvestmentConstructor).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.InvestmentConstructor).toEqual(PersonalFinanceEngine.__test__.taxModels["None"].investmentConstructor);

          expect(PersonalFinanceEngine.__test__.DebtConstructor).toEqual(jasmine.any(Function));
          expect(PersonalFinanceEngine.__test__.DebtConstructor).toEqual(PersonalFinanceEngine.__test__.taxModels["None"].debtConstructor);

          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should have loaded and parsed the correct json tax data into taxData based on the user's selected locale.", function(done) {

      PersonalFinanceEngine.setCountry("Canada")
        .then(function() {

          expect(PersonalFinanceEngine.__test__.taxData.country).toEqual(PersonalFinanceEngine.__test__.countryDetails["Canada"].taxData);
          expect(PersonalFinanceEngine.__test__.taxData.subdivision).toEqual(PersonalFinanceEngine.__test__.subdivisionDetails["Canada"]["Alberta"].taxData);

          return PersonalFinanceEngine.setCountry("None");
        })
        .then(function() {

          expect(PersonalFinanceEngine.__test__.taxData.country).toEqual(PersonalFinanceEngine.__test__.countryDetails["None"].taxData);
          expect(PersonalFinanceEngine.__test__.taxData.subdivision).toEqual(PersonalFinanceEngine.__test__.subdivisionDetails["None"]["None"].taxData);

          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          done();
        })
    });

    it("should populate taxTable when we call calculateTaxTable", function() {
      expect(true).toEqual(false);
    });

    it("should have a private calculateTaxes method on the __test__ scope", function() {
      expect(PersonalFinanceEngine.__test__.calculateTaxes).toBeDefined();
      expect(PersonalFinanceEngine.calculateTaxes).not.toBeDefined();
    });

    it("should reassign the constructors for assets, investments and debts appropritely", function() {
      expect(true).toEqual(false);
    });

  })
});
