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

    beforeAll( function(done) {
      PersonalFinanceEngine.setCountry("None")
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

    it("should have a locale object on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.locale).toEqual(jasmine.any(Object));
    });

    it("should have a setCountry function on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.setCountry).toEqual(jasmine.any(Function));
    });

    it("should have a setFederalSubdivision function on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.setFederalSubdivision).toEqual(jasmine.any(Function));
    });

    it("should allow us to change the locale country using setCountry with valid input.", function(done) {
      var newCountry = "Canada";

      PersonalFinanceEngine.setCountry(newCountry)
        .then( function() {
          var federalSubdivisions = PersonalFinanceEngine.getValidFederalSubdivisions();
          expect(PersonalFinanceEngine.locale.country).toEqual(newCountry);
          expect(federalSubdivisions).toContain("Alberta");
          expect(federalSubdivisions).toContain("British Columbia");
          expect(federalSubdivisions).toContain("Manitoba");
          expect(federalSubdivisions).toContain("New Brunswick");
          expect(federalSubdivisions).toContain("Newfoundland and Labrador");
          expect(federalSubdivisions).toContain("Northwest Territories");
          expect(federalSubdivisions).toContain("Nova Scotia");
          expect(federalSubdivisions).toContain("Nunavut");
          expect(federalSubdivisions).toContain("Ontario");
          expect(federalSubdivisions).toContain("Prince Edward Island");
          expect(federalSubdivisions).toContain("Quebec");
          expect(federalSubdivisions).toContain("Saskatchewan");
          expect(federalSubdivisions).toContain("Yukon");

          expect(PersonalFinanceEngine.__test__.countryDetails["Canada"].taxData).toBeDefined();

          // This one is failing because it runs in the .then I have trailing setCountry
          // where the subdivision loads the taxModel. It is basically just a matter of
          // properly chaining that task into the promises. Needs some thought.
          expect(PersonalFinanceEngine.__test__.taxModels["Canada"]).toBeDefined();

          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          console.log(err.failedInputs)
          done();
        });
    });

    it("should reject with an InvalidInputError when setCountry is given bad input.", function(done) {
      var newCountry = "Not a valid country";

      PersonalFinanceEngine.setCountry(newCountry)
        .then( function() {
          expect(PersonalFinanceEngine.locale.country).not.toEqual(newCountry);
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).not.toEqual(null);
          expect(err.failedInputs.country).toEqual(true);
          done();
        });
    });

    it("should allow us to change the locale subdivision using setFederalSubdivision with valid input.", function(done) {
      var newCountry = "Canada"
      var newSubdivision = "Alberta";
      PersonalFinanceEngine.setCountry(newCountry)
        .then( function() {
          return PersonalFinanceEngine.setFederalSubdivision(newSubdivision);
        })
        .then( function() {
          expect(PersonalFinanceEngine.locale.subdivision).toEqual(newSubdivision);

          expect(PersonalFinanceEngine.__test__.subdivisionDetails["Canada"]["Alberta"].taxData).toBeDefined();

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

    it("should reject with an InvalidInputError when setFederalSubdivision is given bad input.", function(done) {
      var newSubdivision = "Not a valid province";

      PersonalFinanceEngine.setFederalSubdivision(newSubdivision)
        .then( function() {
          expect(PersonalFinanceEngine.locale.subdivision).not.toEqual(newSubdivision);
          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).not.toEqual(null);
          expect(err.failedInputs.subdivision).toEqual(true);
          done();
        });
    });
  })

  describe("personalDetails and associated functions.", function() {

    it("should have a personalDetails object on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.personalDetails).toEqual(jasmine.any(Object));
    });

    it("should have a setPersonalDetails function on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.setPersonalDetails).toEqual(jasmine.any(Function));
    });

    it("should allow us to change the personalDetails using setPersonalDetails with valid input.", function(done) {

      var newPersonalDetails = {
        familyStatus: "Married",
        dependantList: [
          {
            name: "child",
            dateOfBirth: new Date("2016-01-01"),
            disability: false,
            income: 0
          }
        ],
        salary: 100000,
        spouseSalary: 0,
        spouseDisability: false,
        salaryGrowth: 0.05,
        dateOfBirth: new Date("1990-05-20"),
        retirementDate: new Date("2055-05-20"),
        retirementIncome: 0.5
      };

      PersonalFinanceEngine.setPersonalDetails(newPersonalDetails)
        .then( function() {
          expect(PersonalFinanceEngine.personalDetails.familyStatus).toEqual(newPersonalDetails.familyStatus);
          expect(PersonalFinanceEngine.personalDetails.dependantList[0]).toEqual(newPersonalDetails.dependantList[0]);
          expect(PersonalFinanceEngine.personalDetails.salary).toEqual(newPersonalDetails.salary);
          expect(PersonalFinanceEngine.personalDetails.spouseSalary).toEqual(newPersonalDetails.spouseSalary);
          expect(PersonalFinanceEngine.personalDetails.spouseDisability).toEqual(newPersonalDetails.spouseDisability);
          expect(PersonalFinanceEngine.personalDetails.salaryGrowth).toEqual(newPersonalDetails.salaryGrowth);
          expect(PersonalFinanceEngine.personalDetails.dateOfBirth).toEqual(newPersonalDetails.dateOfBirth);
          expect(PersonalFinanceEngine.personalDetails.retirementDate).toEqual(newPersonalDetails.retirementDate);
          expect(PersonalFinanceEngine.personalDetails.retirementIncome).toEqual(newPersonalDetails.retirementIncome);

          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).toEqual(null);
          console.log(err.failedInputs);
          console.log(err.failedInputs.dependantList);
          done();
        });
    });

    it("should reject with an InvalidInputError when setPersonalDetails is given bad input.", function(done) {

      var badPersonalDetails = {
        familyStatus: "no",
        dependantList: [
          {
            name: "no",
            dateOfBirth: "no",
            disability: "no",
            income: "no"
          }
        ],
        salary: "no",
        spouseSalary: "no",
        spouseDisability: "no",
        salaryGrowth: "no",
        dateOfBirth: "no",
        retirementDate: "no",
        retirementIncome: "no"
      };

      PersonalFinanceEngine.setPersonalDetails(badPersonalDetails)
        .then( function() {

          expect(PersonalFinanceEngine.personalDetails.familyStatus).not.toEqual(badPersonalDetails.familyStatus);
          expect(PersonalFinanceEngine.personalDetails.dependantList[0]).not.toEqual(badPersonalDetails.dependantList[0]);
          expect(PersonalFinanceEngine.personalDetails.salary).not.toEqual(badPersonalDetails.salary);
          expect(PersonalFinanceEngine.personalDetails.spouseSalary).not.toEqual(badPersonalDetails.spouseSalary);
          expect(PersonalFinanceEngine.personalDetails.spouseDisability).not.toEqual(badPersonalDetails.spouseDisability);
          expect(PersonalFinanceEngine.personalDetails.salaryGrowth).not.toEqual(badPersonalDetails.salaryGrowth);
          expect(PersonalFinanceEngine.personalDetails.dateOfBirth).not.toEqual(badPersonalDetails.dateOfBirth);
          expect(PersonalFinanceEngine.personalDetails.retirementDate).not.toEqual(badPersonalDetails.retirementDate);
          expect(PersonalFinanceEngine.personalDetails.retirementIncome).not.toEqual(badPersonalDetails.retirementIncome);

          done();
        })
        .catch( function(err) {
          if (err.name !== "InvalidInputError") {
            throw err;
          };
          expect(err).not.toEqual(null);

          expect(err.failedInputs.familyStatus).toEqual(true);
          expect(err.failedInputs.dependantList[0]).toEqual(true);
          expect(err.failedInputs.salary).toEqual(true);
          expect(err.failedInputs.spouseSalary).toEqual(true);
          expect(err.failedInputs.spouseDisability).toEqual(true);
          expect(err.failedInputs.salaryGrowth).toEqual(true);
          expect(err.failedInputs.dateOfBirth).toEqual(true);
          expect(err.failedInputs.retirementDate).toEqual(true);
          expect(err.failedInputs.retirementIncome).toEqual(true);

          done();
        });
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
