"use strict";
describe("Model parameters and other core settings or functions", function() {

  describe("modelParameters properties", function() {

    it("should have a modelParameters object on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.modelParameters).toEqual(jasmine.any(Object));
    });

    it("should have a property called timelineStartDate on modelParameters", function() {
      expect(PersonalFinanceEngine.modelParameters.timelineStartDate).toBeDefined();
    });

    it("should have a property called timelineEndDate on modelParameters", function() {
      expect(PersonalFinanceEngine.modelParameters.timelineEndDate).toBeDefined();
    });

    it("should have a property called userHasSelectedEndDate on modelParameters", function() {
      expect(PersonalFinanceEngine.modelParameters.userHasSelectedEndDate).toBeDefined();
    });

    it("should have a property called userSelectedEndDate on modelParameters", function() {
      expect(PersonalFinanceEngine.modelParameters.userSelectedEndDate).toBeDefined();
    });

    it("should have a property called userHasSelectedEndDate on modelParameters", function() {
      expect(PersonalFinanceEngine.modelParameters.userHasSelectedEndDate).toBeDefined();
    });

    it("should have a property called dataTableRecordFrequency on modelParameters", function() {
      expect(PersonalFinanceEngine.modelParameters.dataTableRecordFrequency).toBeDefined();
    })
  });

  describe("date functions", function() {

    describe("User selected end date functions", function() {

      var userInputDate = new Date("2016-01-01");
      var badUserInputDate = "abc";
      var investmentInput;
      var investmentID;

      beforeAll( function(done) {
        investmentInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly",
        }
        PersonalFinanceEngine.deleteUserSelectedEndDate()
        .then( function() {
          return PersonalFinanceEngine.createInvestment(investmentInput);
        })
        .then( function(returnID) {
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
      })

      beforeEach( function() {
        PersonalFinanceEngine.deleteUserSelectedEndDate();
      })

      afterAll( function(done) {
        PersonalFinanceEngine.deleteInvestment(investmentID)
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
      })

      it("should have a method called setUserSelectedEndDate on the PersonalFinanceEngine scope", function() {
        expect(PersonalFinanceEngine.setUserSelectedEndDate).toEqual(jasmine.any(Function));
      });

      it("should have a method called deleteUserSelectedEndDate on the PersonalFinanceEngine scope", function() {
        expect(PersonalFinanceEngine.deleteUserSelectedEndDate).toEqual(jasmine.any(Function));
      });

      it("should replace the default timelineEndDate with the userSelectedEndDate", function(done) {
        expect(PersonalFinanceEngine.modelParameters.userHasSelectedEndDate).toEqual(false);
        expect(PersonalFinanceEngine.modelParameters.timelineEndDate.isSame(moment(investmentInput.startDate))).toEqual(true);
        PersonalFinanceEngine.setUserSelectedEndDate(userInputDate)
          .then( function() {
            expect(PersonalFinanceEngine.modelParameters.timelineEndDate.isSame(moment(userInputDate))).toEqual(true);
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

      it("should not replace the default timelineEndDate with the userSelectedEndDate when the user provides bad input", function(done) {
        expect(PersonalFinanceEngine.modelParameters.userHasSelectedEndDate).toEqual(false);
        expect(PersonalFinanceEngine.modelParameters.timelineEndDate.isSame(moment(investmentInput.startDate))).toEqual(true);
        PersonalFinanceEngine.setUserSelectedEndDate(badUserInputDate)
          .then( function() {
            expect(PersonalFinanceEngine.modelParameters.timelineEndDate.isSame(moment(userInputDate))).toEqual(true);
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.date).toEqual(true);
            done();
          });
      });

      it("should delete the userSelectedEndDate and return to the default transfer derived timelineEndDate", function(done) {
        PersonalFinanceEngine.setUserSelectedEndDate(userInputDate)
          .then( function() {
            expect(PersonalFinanceEngine.modelParameters.timelineEndDate.isSame(moment(userInputDate))).toEqual(true);
            return PersonalFinanceEngine.deleteUserSelectedEndDate();
          })
          .then( function() {
            expect(PersonalFinanceEngine.modelParameters.userHasSelectedEndDate).toEqual(false);
            expect(PersonalFinanceEngine.modelParameters.timelineEndDate.isSame(moment(investmentInput.startDate))).toEqual(true);
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
    });

    describe("Find min and max dates", function() {

      var investmentInput1;
      var investmentID1;
      var investmentInput2;
      var investmentID2;
      var recurringTransferInput;
      var recurringTransferID;
      var expectedMinDate = new Date("1970-01-01");
      var expectedMaxDate = new Date("1975-01-01");

      beforeAll( function(done) {
        investmentInput1 = {
          name: "Test",
          subType: "",
          startDate: expectedMinDate, // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly",
        }

        investmentInput2 = {
          name: "Test",
          subType: "",
          startDate: new Date("1972-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly",
        }

        PersonalFinanceEngine.createInvestment(investmentInput1)
          .then( function(returnID) {
            investmentID1 = returnID;
            return PersonalFinanceEngine.createInvestment(investmentInput2);
          })
          .then( function(returnID) {
            investmentID2 = returnID;
            recurringTransferInput = {
              fromAccount: PersonalFinanceEngine.investmentAccounts[investmentID1],
              toAccount: PersonalFinanceEngine.investmentAccounts[investmentID2],
              valueFunction: function(){return 10;},
              startDate: new Date("1972-01-01"),
              endDate: expectedMaxDate,
              frequency: "Monthly",
            };
            return PersonalFinanceEngine.createRecurringTransfer(recurringTransferInput);
          })
          .then( function(returnID) {
            recurringTransferID = returnID;
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

      afterAll( function(done) {
        PersonalFinanceEngine.deleteInvestment(investmentID1)
          .then( function() {
            return PersonalFinanceEngine.deleteInvestment(investmentID2);
          })
          .then( function () {
            return PersonalFinanceEngine.deleteTransfer(recurringTransferID);
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
      })

      it("should have a private findMinDate method on the __test__ scope", function() {
        expect(PersonalFinanceEngine.__test__.findMinDate).toEqual(jasmine.any(Function));
        expect(PersonalFinanceEngine.findMinDate).not.toBeDefined();
      });

      it("should have a private findMaxDate method on the __test__ scope", function() {
        expect(PersonalFinanceEngine.__test__.findMaxDate).toEqual(jasmine.any(Function));
        expect(PersonalFinanceEngine.findMaxDate).not.toBeDefined();
      });

      it("should return the expectedMinDate when findMinDate is called", function() {
        expect(PersonalFinanceEngine.__test__.findMinDate().isSame(moment(expectedMinDate))).toEqual(true);
      });

      it("should return the expectedMaxDate when findMaxDate is called", function() {
        expect(PersonalFinanceEngine.__test__.findMaxDate().isSame(moment(expectedMaxDate))).toEqual(true);
      });
    });
  });

  describe("Recording Frequency functions", function() {

    afterAll( function(done) {
      PersonalFinanceEngine.setDataTableRecordFrequency("Annually")
        .then( function() {
          done();
        })
    })

    it("should have a function called setDataTableRecordFrequency() on the PersonalFinanceEngine scope", function() {
      expect(PersonalFinanceEngine.setDataTableRecordFrequency).toEqual(jasmine.any(Function));
    })

    it("should allow the user to set dataTableRecordFrequency using the function setDataTableRecordFrequency()", function(done) {
      expect(PersonalFinanceEngine.modelParameters.dataTableRecordFrequency).toEqual("Annually");

      PersonalFinanceEngine.setDataTableRecordFrequency("Annually")
        .then( function() {
          expect(PersonalFinanceEngine.modelParameters.dataTableRecordFrequency).toEqual("Annually");

          return PersonalFinanceEngine.setDataTableRecordFrequency("Semiannually");
        })
        .then( function() {
          expect(PersonalFinanceEngine.modelParameters.dataTableRecordFrequency).toEqual("Semiannually");

          return PersonalFinanceEngine.setDataTableRecordFrequency("Quarterly");
        })
        .then( function() {
          expect(PersonalFinanceEngine.modelParameters.dataTableRecordFrequency).toEqual("Quarterly");

          return PersonalFinanceEngine.setDataTableRecordFrequency("Monthly");
        })
        .then( function() {
          expect(PersonalFinanceEngine.modelParameters.dataTableRecordFrequency).toEqual("Monthly");

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

  describe("locale and associated functions.", function() {

    it("should have a locale object on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.locale).toEqual(jasmine.any(Object));
    });

    it("should have a setLocale function on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.setLocale).toEqual(jasmine.any(Function));
    });

    it("should allow us to change the local properties using setLocale with valid input.", function() {
      expect(true).toEqual(false);
    });

    it("should reject with an InvalidInputError when setLocale is given bad input.", function() {
      expect(true).toEqual(false);
    });
  })

  describe("personalDetails and associated functions.", function() {

    it("should have a personalDetails object on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.personalDetails).toEqual(jasmine.any(Object));
    });

    it("should have a setPersonalDetails function on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.setPersonalDetails).toEqual(jasmine.any(Function));
    });

    it("should allow us to change the personalDetails using setPersonalDetails with valid input.", function() {
      expect(true).toEqual(false);
    });

    it("should reject with an InvalidInputError when setPersonalDetails is given bad input.", function() {
      expect(true).toEqual(false);
    });
  })

  describe("generateUUID()", function() {

    var testUUID;

    beforeEach(function() {
      testUUID = PersonalFinanceEngine.__test__.generateUUID();
    })

    it("should have a private generateUUID method on the __test__ scope", function() {
      expect(PersonalFinanceEngine.__test__.generateUUID).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.generateUUID).not.toBeDefined();
    });

    it("should generate UUIDs matching the version 4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx", function() {
      //Regex for the format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/.test(testUUID)).toEqual(true);
    });

  });
});
