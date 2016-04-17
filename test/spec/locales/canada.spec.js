describe("Canada tax model and calculations", function() {

  beforeAll( function(done) {
    PersonalFinanceEngine.setCountry("Canada")
      .then( function() {
        done();
      })
  });

  afterAll( function(done) {
    PersonalFinanceEngine.setCountry("None")
      .then( function() {
        done();
      })
  });

  describe("constructors", function() {

    describe("Asset constructor", function() {

      var testAsset;

      beforeEach(function() {
        testAsset = new PersonalFinanceEngine.__test__.AssetConstructor({
          ID: "3c9c7e16-e8ba-4076-b25d-08c36b24453d",
          name: "Test",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05
        });
      });

      it("should be true that testAsset is an instance of AssetConstructor", function () {
        expect(testAsset instanceof PersonalFinanceEngine.__test__.AssetConstructor).toEqual(true);
      });

      it("should create the test Asset object 'testAsset' with our init values", function () {
        // Only test the changed properties in the sub prototype
        expect(testAsset.type).toEqual("Asset");
      });

    });


    describe("InvestmentConstructor", function() {

      var testInvestment;

      beforeAll(function() {
        testInvestment = new PersonalFinanceEngine.__test__.InvestmentConstructor({
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly",
        });
      });

      it("should be true that testInvestment is an instance of InvestmentConstructor", function () {
        expect(testInvestment instanceof PersonalFinanceEngine.__test__.InvestmentConstructor).toEqual(true);
      });

      it("should create the test Investment object 'testInvestment' with our init values", function () {
        expect(testInvestment.type).toEqual("Investment");
        expect(testInvestment.subType).toEqual("");
        expect(testInvestment.accrualPaymentFrequency).toEqual("Monthly");
        expect(testInvestment.currentYearTaxableAmount).toEqual(0);
        expect(testInvestment.lastYearTaxableAmount).toEqual(0);
      });

    });

    describe("DebtConstructor", function() {

      var testDebt;

      beforeEach(function() {
        testDebt = new PersonalFinanceEngine.__test__.DebtConstructor({
          ID: "3c9c7e16-e8ba-4076-b25d-08c36b24453d",
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0, // With a negative accrual weight (depreciation) of 5% annually.
          accrualPaymentFrequency: "Monthly",
        });
      });

      it("should be true that testDebt is an instance of DebtConstructor", function () {
        expect(testDebt instanceof PersonalFinanceEngine.__test__.DebtConstructor).toEqual(true);
      });

      it("should create the test DebtConstructor object 'testDebt' with our init values", function () {
        expect(testDebt.type).toEqual("Debt");
        expect(testDebt.subType).toEqual("");
        expect(testDebt.accrualPaymentFrequency).toEqual("Monthly");
      });

    });

  });

  describe("calculateTaxTable", function() {

    it("should create a taxTable when we call calculateTaxTable()", function() {
      PersonalFinanceEngine.__test__.calculateTaxTable();

      expect(PersonalFinanceEngine.__test__.taxTable).toEqual(jasmine.any(Object));
      expect(PersonalFinanceEngine.__test__.taxTable.marginalRate).toBeDefined();
      expect(PersonalFinanceEngine.__test__.taxTable.eligibleDividend).toBeDefined();
      expect(PersonalFinanceEngine.__test__.taxTable.otherDividend).toBeDefined();
      expect(PersonalFinanceEngine.__test__.taxTable.capitalGains).toBeDefined();
    });

    it("should have a tax rate of zero for all income types if the user has no income", function() {
      PersonalFinanceEngine.__test__.calculateTaxTable();

      expect(PersonalFinanceEngine.__test__.taxTable).toEqual(jasmine.any(Object));
      expect(PersonalFinanceEngine.__test__.taxTable.marginalRate).toEqual(0);
      expect(PersonalFinanceEngine.__test__.taxTable.eligibleDividend).toEqual(0);
      expect(PersonalFinanceEngine.__test__.taxTable.otherDividend).toEqual(0);
      expect(PersonalFinanceEngine.__test__.taxTable.capitalGains).toEqual(0);
    });

    it("should correctly account for direct salary income", function(done) {

      var newDetails = {
        familyStatus: "Single",
        dependantList: [],
        salary: 100000,
        spouseSalary: 0,
        spouseDisability: false,
        salaryGrowth: 0,
        dateOfBirth: new Date("1990-05-20"),
        retirementDate: new Date("2055-05-20"),
        retirementIncome: 0.5,
      };

      PersonalFinanceEngine.setPersonalDetails(newDetails)
        .then(function(){
          PersonalFinanceEngine.__test__.calculateTaxTable();

          expect(PersonalFinanceEngine.__test__.taxTable).toEqual(jasmine.any(Object));
          expect(PersonalFinanceEngine.__test__.taxTable.marginalRate).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.__test__.taxTable.eligibleDividend).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.__test__.taxTable.otherDividend).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.__test__.taxTable.capitalGains).toBeGreaterThan(0);

          newDetails.salary = 0;

          return PersonalFinanceEngine.setPersonalDetails(newDetails);
        })
        .then(function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          console.log(err.failedInputs);
          done();
        });
    });

    it("should correctly account for investment interest", function(done) {

      var investmentInput = {
        name: "Test",
        subType: "",
        startDate: new Date("2000-01-01"), // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.05,
        accrualPaymentFrequency: "Monthly",
      };

      var investmentID;

      PersonalFinanceEngine.createInvestment(investmentInput)
        .then(function(returnID){

          investmentID = returnID;

          // Hotwire some taxable values into our investment.
          PersonalFinanceEngine.investmentAccounts[investmentID].currentYearNetAccruals = 100000;
          PersonalFinanceEngine.investmentAccounts[investmentID].currentYearTaxableAmount = 100000;

          PersonalFinanceEngine.__test__.calculateTaxTable();

          expect(PersonalFinanceEngine.__test__.taxTable).toEqual(jasmine.any(Object));
          expect(PersonalFinanceEngine.__test__.taxTable.marginalRate).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.__test__.taxTable.eligibleDividend).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.__test__.taxTable.otherDividend).toBeGreaterThan(0);
          expect(PersonalFinanceEngine.__test__.taxTable.capitalGains).toBeGreaterThan(0);

          return PersonalFinanceEngine.deleteInvestment(investmentID);
        })
        .then(function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          console.log(err.failedInputs);
          done();
        });
    });

    it("should correctly account for dividend income", function() {
      expect(true).toEqual(false);
    });

    it("should correctly account for capital gains income", function() {
      expect(true).toEqual(false);
    });
  });

  describe("getTaxRate", function() {

    var newDetails = {
      familyStatus: "Single",
      dependantList: [],
      salary: 100000,
      spouseSalary: 0,
      spouseDisability: false,
      salaryGrowth: 0,
      dateOfBirth: new Date("1990-05-20"),
      retirementDate: new Date("2055-05-20"),
      retirementIncome: 0.5,
    };

    var investmentInput = {
      name: "Test",
      subType: "",
      startDate: new Date("2000-01-01"), // Create a date of January 1st 1970.
      fromAccount: "external",
      initialValue: 1000,  // Start balance of $1000
      accrualRate: 0.05,
      accrualPaymentFrequency: "Monthly",
    };

    var investmentID;

    // Set up a salary and a taxable investment.
    beforeAll(function(done) {

      PersonalFinanceEngine.setPersonalDetails(newDetails)
        .then(function(){
          return PersonalFinanceEngine.createInvestment(investmentInput);
        })
        .then(function(returnID) {
          investmentID = returnID;
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          console.log(err.failedInputs);
          done();
        });
    });

    // Clear out the investment and salary changes
    afterAll(function(done) {

      newDetails.salary = 0;

      PersonalFinanceEngine.setPersonalDetails(newDetails)
        .then(function(){
          return PersonalFinanceEngine.deleteInvestment(investmentID);
        })
        .then(function() {
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          console.log(err.failedInputs);
          done();
        });
    });

    it("should return a weighted average marginal rate for the user's chequing account", function() {

      // Hotwire some taxable values into our investment.
      PersonalFinanceEngine.__test__.chequingAccount.currentYearNetAccruals= 100000;
      PersonalFinanceEngine.__test__.chequingAccount.currentYearTaxableAmount = 100000;

      PersonalFinanceEngine.__test__.calculateTaxTable();

      var chequingTaxRate = PersonalFinanceEngine.__test__.getTaxRate(PersonalPersonalFinanceEngine.__test__.chequingAccount);

      expect(chequingTaxRate).toBeGreaterThan(0);

    });

    it("should return a weighted average marginal rate for the investment", function() {

    });

  });

  describe("calculate() with taxes", function() {


  });

});
