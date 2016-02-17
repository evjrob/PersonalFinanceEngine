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
      var investmentInput1;
      var investmentInput2;
      var investmentID1;
      var investmentID2;
      var transferInput;
      var investmentDate = new Date("1970-01-01");
      var transferDate1 = new Date("1975-01-01");
      var transferDate2 = new Date("1972-06-15");
      var oneTimeTranferID1;
      var oneTimeTranferID2;
      var oneTimeTranferID3;

      beforeEach( function(done){

        investmentInput1 = {
          name: "Test1",
          subType: "",
          startDate: investmentDate, // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.0,
          accrualPaymentFrequency: "Monthly"
        };

        investmentInput2 = {
          name: "Test2",
          subType: "",
          startDate: investmentDate, // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.0,
          accrualPaymentFrequency: "Monthly"
        };

        PersonalFinanceEngine.modelParameters.timelineEndDate = moment(transferDate1);

        PersonalFinanceEngine.createInvestment(investmentInput1)
          .then(function (returnID) {
            investmentID1 = returnID;
            return PersonalFinanceEngine.createInvestment(investmentInput2);
          })
          .then(function (returnID) {
            investmentID2 = returnID;
            transferInput = {
              fromAccount: PersonalFinanceEngine.investmentAccounts[investmentID1],
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID2],
              valueFunction: function(){return 2000;},
              date: transferDate1,
            };
            return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
          })
          .then(function (returnID) {
            oneTimeTranferID1 = returnID;
            transferInput = {
              fromAccount: PersonalFinanceEngine.investmentAccounts[investmentID1],
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID2],
              valueFunction: function(){return 500;},
              date: transferDate1,
            };
            return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
          })
          .then(function (returnID) {
            oneTimeTranferID2 = returnID;
            transferInput = {
              fromAccount: PersonalFinanceEngine.investmentAccounts[investmentID1],
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID2],
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
      });

      it("should have timeline properties for all of the investment startDates and OneTimeTransfer dates", function () {
        expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)]).toBeDefined();
        expect(PersonalFinanceEngine.__test__.timeline[moment(transferDate1).format(timelineDateFormat)]).toBeDefined();
        expect(PersonalFinanceEngine.__test__.timeline[moment(transferDate2).format(timelineDateFormat)]).toBeDefined();
      });

      it("should have the appropriate transfer functions at all of our dates.", function () {
        expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)]).toContain(jasmine.any(Function));
        expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)][0]).toEqual(jasmine.any(Number));
        expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)][1]).toEqual(jasmine.any(Number));
        expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)].length).toEqual(2);
        expect(PersonalFinanceEngine.__test__.timeline[moment(transferDate1).format(timelineDateFormat)]).toContain(jasmine.any(Function));
        expect(PersonalFinanceEngine.__test__.timeline[moment(transferDate1).format(timelineDateFormat)][0]).toEqual(jasmine.any(Number));
        expect(PersonalFinanceEngine.__test__.timeline[moment(transferDate1).format(timelineDateFormat)].length).toEqual(1);
        expect(PersonalFinanceEngine.__test__.timeline[moment(transferDate2).format(timelineDateFormat)]).toContain(jasmine.any(Function));
        expect(PersonalFinanceEngine.__test__.timeline[moment(transferDate2).format(timelineDateFormat)][0]).toEqual(jasmine.any(Number));
        expect(PersonalFinanceEngine.__test__.timeline[moment(transferDate2).format(timelineDateFormat)].length).toEqual(1);
      });
    });

    describe("RecurringTransfers", function() {
      var investmentInput;
      var investmentID;
      var transferInput;
      var investmentDate = new Date("1970-01-01");
      var transferStartDate = new Date("1970-01-01");
      var transferEndDate = new Date("1972-12-31");
      var transferAmount = 500;
      var recurringTranferID;

      beforeEach( function(){

        investmentInput = {
          name: "Test1",
          subType: "",
          startDate: investmentDate, // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.0,
          accrualPaymentFrequency: "Monthly",
        };

        PersonalFinanceEngine.modelParameters.timelineEndDate = moment(transferEndDate);
      });

      it("should have timeline properties for the investment startDate and the RecurringTransfer dates for an annual frequency", function (done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then(function (returnID) {
            investmentID = returnID;
            transferInput = {
              fromAccount: "external",
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
              valueFunction: function(){return transferAmount;},
              startDate: transferStartDate,
              endDate: transferEndDate,
              frequency: "Annually",
            };
            return PersonalFinanceEngine.createRecurringTransfer(transferInput);
          })
          .then(function (returnID) {
            recurringTranferID = returnID;
            PersonalFinanceEngine.__test__.constructTimeline();
            expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= moment(transferEndDate).diff(transferStartDate, "years"); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment(transferStartDate).add(i, "years").format(timelineDateFormat)]).toBeDefined();
              //expect(PersonalFinanceEngine.__test__.timeline[moment(transferStartDate).add(i, "years").format(timelineDateFormat)][0]).toEqual(transferAmount);
            }
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
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then(function (returnID) {
            investmentID = returnID;
            transferInput = {
              fromAccount: "external",
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
              valueFunction: function(){return transferAmount;},
              startDate: transferStartDate,
              endDate: transferEndDate,
              frequency: "Semiannually",
            };
            return PersonalFinanceEngine.createRecurringTransfer(transferInput);
          })
          .then(function (returnID) {
            recurringTranferID = returnID;
            expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(transferStartDate, "quarters")/2); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment(transferStartDate).add(2*i, "quarters").format(timelineDateFormat)]).toBeDefined();
            }
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
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then(function (returnID) {
            investmentID = returnID;
            transferInput = {
              fromAccount: "external",
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
              valueFunction: function(){return transferAmount;},
              startDate: transferStartDate,
              endDate: transferEndDate,
              frequency: "Quarterly",
            };
            return PersonalFinanceEngine.createRecurringTransfer(transferInput);
          })
          .then(function (returnID) {
            recurringTranferID = returnID;
            expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(transferStartDate, "quarters")); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment(transferStartDate).add(i, "quarters").format(timelineDateFormat)]).toBeDefined();
            }
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
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then(function (returnID) {
            investmentID = returnID;
            transferInput = {
              fromAccount: "external",
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
              valueFunction: function(){return transferAmount;},
              startDate: transferStartDate,
              endDate: transferEndDate,
              frequency: "Monthly",
            };
            return PersonalFinanceEngine.createRecurringTransfer(transferInput);
          })
          .then(function (returnID) {
            recurringTranferID = returnID;
            expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(transferStartDate, "months")); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment(transferStartDate).add(i, "months").format(timelineDateFormat)]).toBeDefined();
            }
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
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then(function (returnID) {
            investmentID = returnID;
            transferInput = {
              fromAccount: "external",
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
              valueFunction: function(){return transferAmount;},
              startDate: transferStartDate,
              endDate: transferEndDate,
              frequency: "Biweekly",
            };
            return PersonalFinanceEngine.createRecurringTransfer(transferInput);
          })
          .then(function (returnID) {
            recurringTranferID = returnID;
            expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(transferStartDate, "weeks")/2); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment(transferStartDate).add(2*i, "weeks").format(timelineDateFormat)]).toBeDefined();
            }
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
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then(function (returnID) {
            investmentID = returnID;
            transferInput = {
              fromAccount: "external",
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID],
              valueFunction: function(){return transferAmount;},
              startDate: transferStartDate,
              endDate: transferEndDate,
              frequency: "Weekly",
            };
            return PersonalFinanceEngine.createRecurringTransfer(transferInput);
          })
          .then(function (returnID) {
            recurringTranferID = returnID;
            expect(PersonalFinanceEngine.__test__.timeline[moment(investmentDate).format(timelineDateFormat)]).toBeDefined();

            // Test the recurring dates
            for (var i = 0; i <= (moment(transferEndDate).diff(transferStartDate, "weeks")); i++) {
              expect(PersonalFinanceEngine.__test__.timeline[moment(transferStartDate).add(i, "weeks").format(timelineDateFormat)]).toBeDefined();
            }
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
