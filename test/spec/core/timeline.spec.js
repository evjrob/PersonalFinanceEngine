"use strict";
describe("Timeline and associated functions", function() {

  var timelineDateFormat = "YYYY-MM-DD";

  it("should have a private timeline object on the __test__ scope", function() {
    expect(PersonalFinanceEngine.__test__.timeline).toEqual(jasmine.any(Object));
    expect(PersonalFinanceEngine.timeline).not.toBeDefined();
  });
  describe("Construct timeline", function() {

    it("should have a private constructTimeline method on the __test__ scope", function() {
      expect(PersonalFinanceEngine.__test__.constructTimeline).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.constructTimeline).not.toBeDefined();
    });

    describe("OneTimeTransfers", function() {
      var assetInput1;
      var assetInput2;
      var assetID1;
      var assetID2;
      var transferInput;
      var assetDate;
      var transferDate1;
      var transferDate2;
      var oneTimeTranferID1;
      var oneTimeTranferID2;
      var oneTimeTranferID3;

      beforeAll( function(done){

        assetDate = new Date("1970-01-01");
        transferDate1 = new Date("1975-01-02");
        transferDate2 = new Date("1972-06-15");

        assetInput1 = {
          name: "Test1",
          subType: "",
          startDate: assetDate, // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.0,
        };

        assetInput2 = {
          name: "Test2",
          subType: "",
          startDate: assetDate, // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.0,
        };

        PersonalFinanceEngine.createAsset(assetInput1)
          .then(function (returnID) {
            assetID1 = returnID;
            return PersonalFinanceEngine.createAsset(assetInput2);
          })
          .then(function (returnID) {
            assetID2 = returnID;
            transferInput = {
              fromAccount: PersonalFinanceEngine.assets[assetID1],
              toAccount: PersonalFinanceEngine.assets[assetID2],
              valueFunction: function(){return 2000;},
              date: transferDate1,
            };
            return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
          })
          .then(function (returnID) {
            oneTimeTranferID1 = returnID;
            transferInput = {
              fromAccount: PersonalFinanceEngine.assets[assetID1],
              toAccount: PersonalFinanceEngine.assets[assetID2],
              valueFunction: function(){return 500;},
              date: transferDate1,
            };
            return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
          })
          .then(function (returnID) {
            oneTimeTranferID2 = returnID;
            transferInput = {
              fromAccount: PersonalFinanceEngine.assets[assetID1],
              toAccount: PersonalFinanceEngine.assets[assetID2],
              valueFunction: function(){return 500;},
              date: transferDate2,
            };
            return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
          })
          .then(function (returnID) {
            oneTimeTranferID3 = returnID;

            PersonalFinanceEngine.__test__.constructTimeline();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      })

      // Clear out all of the financialObjects and transfers we made
      afterAll( function(done) {
        PersonalFinanceEngine.deleteAsset(assetID1)
          .then(function () {
            return PersonalFinanceEngine.deleteAsset(assetID2);
          })
          .then(function () {
            return PersonalFinanceEngine.deleteTransfer(oneTimeTranferID1);
          })
          .then(function () {
            return PersonalFinanceEngine.deleteTransfer(oneTimeTranferID2);
          })
          .then(function () {
            return PersonalFinanceEngine.deleteTransfer(oneTimeTranferID3);
          })
          .then(function () {
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      })

      it("should have timeline properties and transfer functions for all of the asset startDates and OneTimeTransfer dates", function (done) {
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(assetDate).format(timelineDateFormat)]).toBeDefined();
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferDate1).format(timelineDateFormat)]).toBeDefined();
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferDate2).format(timelineDateFormat)]).toBeDefined();
        done();
      });

      // Need to figure out how to get the calculator cleared after each spec without the async ruining other specs.
      // This spec works on it's own but not when run with the rest and with the length expectations.
      it("should have the appropriate transfer functions at all of our dates.", function (done) {
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(assetDate).format(timelineDateFormat)]).toContain(jasmine.any(Function));
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(assetDate).format(timelineDateFormat)][0]()).toEqual(jasmine.any(Number));
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(assetDate).format(timelineDateFormat)][1]()).toEqual(jasmine.any(Number));
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(assetDate).format(timelineDateFormat)].length).toEqual(2);
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferDate1).format(timelineDateFormat)]).toContain(jasmine.any(Function));
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferDate1).format(timelineDateFormat)][0]()).toEqual(jasmine.any(Number));
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferDate1).format(timelineDateFormat)].length).toEqual(2);
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferDate2).format(timelineDateFormat)]).toContain(jasmine.any(Function));
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferDate2).format(timelineDateFormat)][0]()).toEqual(jasmine.any(Number));
        expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferDate2).format(timelineDateFormat)].length).toEqual(1);
        done();
      });
    });

    describe("RecurringTransfers", function() {

      var investmentInput;
      var investmentID;
      var transferInput;
      var investmentDate = new Date("1970-01-01");
      var transferStartDate = new Date("1970-01-02");
      var transferEndDate = new Date("1972-12-31");
      var transferAmount = 500;
      var recurringTranferID;

      beforeAll( function(done){
        investmentInput = {
          name: "Test1",
          subType: "",
          startDate: investmentDate, // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.0,
          accrualPaymentFrequency: "Monthly",
        };

        PersonalFinanceEngine.createInvestment(investmentInput)
          .then(function (returnID) {
            investmentID = returnID;
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      afterAll(function(done) {
        PersonalFinanceEngine.deleteInvestment(investmentID)
          .then(function () {
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      it("should have timeline properties for the investment startDate and the RecurringTransfer dates for an annual frequency", function (done) {

        transferInput = {
          fromAccount: "external",
          toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
          valueFunction: function(){return transferAmount;},
          startDate: transferStartDate,
          endDate: transferEndDate,
          frequency: "Annually",
        };

        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then(function (returnID) {
            recurringTranferID = returnID;
            PersonalFinanceEngine.__test__.constructTimeline();
            expect(PersonalFinanceEngine.__test__.timeline[moment.utc(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= moment(transferEndDate).diff(moment.utc(transferStartDate), "years"); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferStartDate).add(i, "years").format(timelineDateFormat)]).toBeDefined();
              //expect(PersonalFinanceEngine.__test__.timeline[moment(transferStartDate).add(i, "years").format(timelineDateFormat)][0]).toEqual(transferAmount);
            }

            return PersonalFinanceEngine.deleteTransfer(recurringTranferID);
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
          });
      });

      it("should have timeline properties for the investment startDate and the RecurringTransfer dates for a semiannual frequency", function (done) {
        transferInput = {
          fromAccount: "external",
          toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
          valueFunction: function(){return transferAmount;},
          startDate: transferStartDate,
          endDate: transferEndDate,
          frequency: "Semiannually",
        };
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then(function (returnID) {
            recurringTranferID = returnID;
            PersonalFinanceEngine.__test__.constructTimeline();
            expect(PersonalFinanceEngine.__test__.timeline[moment.utc(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(moment.utc(transferStartDate), "quarters")/2); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferStartDate).add(2*i, "quarters").format(timelineDateFormat)]).toBeDefined();
            }
            return PersonalFinanceEngine.deleteTransfer(recurringTranferID);
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
          });
      });

      it("should have timeline properties for the investment startDate and the RecurringTransfer dates for a quarterly frequency", function (done) {
        transferInput = {
          fromAccount: "external",
          toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
          valueFunction: function(){return transferAmount;},
          startDate: transferStartDate,
          endDate: transferEndDate,
          frequency: "Quarterly",
        };
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then(function (returnID) {
            recurringTranferID = returnID;
            PersonalFinanceEngine.__test__.constructTimeline();
            expect(PersonalFinanceEngine.__test__.timeline[moment.utc(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(moment.utc(transferStartDate), "quarters")); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferStartDate).add(i, "quarters").format(timelineDateFormat)]).toBeDefined();
            }
            return PersonalFinanceEngine.deleteTransfer(recurringTranferID);
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
          });
      });

      it("should have timeline properties for the investment startDate and the RecurringTransfer dates for a monthly frequency", function (done) {
        transferInput = {
          fromAccount: "external",
          toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
          valueFunction: function(){return transferAmount;},
          startDate: transferStartDate,
          endDate: transferEndDate,
          frequency: "Monthly",
        };
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then(function (returnID) {
            recurringTranferID = returnID;
            PersonalFinanceEngine.__test__.constructTimeline();
            expect(PersonalFinanceEngine.__test__.timeline[moment.utc(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(moment.utc(transferStartDate), "months")); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferStartDate).add(i, "months").format(timelineDateFormat)]).toBeDefined();
            }
            return PersonalFinanceEngine.deleteTransfer(recurringTranferID);
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
          });
      });

      it("should have timeline properties for the investment startDate and the RecurringTransfer dates for a biweeky frequency", function (done) {
        transferInput = {
          fromAccount: "external",
          toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
          valueFunction: function(){return transferAmount;},
          startDate: transferStartDate,
          endDate: transferEndDate,
          frequency: "Biweekly",
        };
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then(function (returnID) {
            recurringTranferID = returnID;
            PersonalFinanceEngine.__test__.constructTimeline();
            expect(PersonalFinanceEngine.__test__.timeline[moment.utc(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(moment.utc(transferStartDate), "weeks")/2); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferStartDate).add(2*i, "weeks").format(timelineDateFormat)]).toBeDefined();
            }
            return PersonalFinanceEngine.deleteTransfer(recurringTranferID);
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
          });
      });

      it("should have timeline properties for the investment startDate and the RecurringTransfer dates for a weeky frequency", function (done) {
        transferInput = {
          fromAccount: "external",
          toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
          valueFunction: function(){return transferAmount;},
          startDate: transferStartDate,
          endDate: transferEndDate,
          frequency: "Weekly",
        };
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then(function (returnID) {
            recurringTranferID = returnID;
            PersonalFinanceEngine.__test__.constructTimeline();
            expect(PersonalFinanceEngine.__test__.timeline[moment.utc(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(moment.utc(transferStartDate), "weeks")); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment.utc(transferStartDate).add(i, "weeks").format(timelineDateFormat)]).toBeDefined();
            }
            return PersonalFinanceEngine.deleteTransfer(recurringTranferID);
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
          });
      });
    });
  })


});
