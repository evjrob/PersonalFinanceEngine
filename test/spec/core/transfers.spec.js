
describe("Transfer Interfaces", function() {
  describe("transfer()", function() {

    var testObject;
    var testObject2;

    beforeEach(function() {
      testObject = new PersonalFinanceEngine.__test__.FinancialObject({
        name: "Test",
        startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.05
      });
      // Manually clear the initialValue transaction;
      testObject.value = 1000;

      testObject2 = new PersonalFinanceEngine.__test__.FinancialObject({
        name: "Test2",
        startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.05
      });
      // Manually clear the initialValue transaction;
      testObject2.value = 1000;
    });

    it("should have a transfer method on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.transfer).toEqual(jasmine.any(Function));
    });

    it("should correctly reallocate funds from one FinancialObject to another", function() {
      expect(testObject.value).toEqual(1000);
      expect(testObject.value == testObject2.value).toEqual(true);
      PersonalFinanceEngine.transfer(testObject, testObject2, 1000);
      expect(testObject.value).toEqual(0);
      expect(testObject2.value).toEqual(2000);
    });

    it("should correctly reallocate funds from one FinancialObject to another (neagtive case)", function() {
      expect(testObject.value).toEqual(1000);
      expect(testObject.value == testObject2.value).toEqual(true);
      PersonalFinanceEngine.transfer(testObject, testObject2, -1000);
      expect(testObject.value).toEqual(2000);
      expect(testObject2.value).toEqual(0);
    });
  });

  describe("Public OneTime Transfer Interface", function() {
    describe("Create", function() {

      var err;
      var transferID;
      var transferInput;
      var badDateInput;
      var badValueFunctionInput;
      var insufficientInput;

      beforeEach(function() {
        testFinancialAccount1 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        testFinancialAccount2 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test2",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        transferInput = {
          fromAccount: testFinancialAccount1,
          toAccount: testFinancialAccount2,
          valueFunction: function(){return 1000;},
          date: new Date("1970-01-01"),
        };

        // Only one parameter and it's just a value not even a valueFunction.
        insufficientInput = {
          value: function(){return 1000;}
        };
      });

      it("should have an createOneTimeTransfer method on the PersonalFinanceEngine scope.", function(done) {
        expect(PersonalFinanceEngine.createOneTimeTransfer).toEqual(jasmine.any(Function));
        done();
      });

      it("should return the UUID of the TransferDefinition when we call createOneTimeTransfer() with valid input", function(done) {
        PersonalFinanceEngine.createOneTimeTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      it("should place the created TransferDefinition into the transferDefinitions map", function(done) {
        PersonalFinanceEngine.createOneTimeTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID]).toEqual(jasmine.any(Object));
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      it("should return an error object identifying the date as an issue when the input contains a malformed date", function(done) {
        transferInput.date = "abc";
        PersonalFinanceEngine.createOneTimeTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.toAccount).toEqual(false);
            expect(err.failedInputs.valueFunction).toEqual(false);
            expect(err.failedInputs.date).toEqual(true);
            done();
          });
      });

      it("should return an error object identifying the valueFunction as an issue when the input contains a malformed valueFunction", function(done) {
        transferInput.valueFunction = "abc";
        PersonalFinanceEngine.createOneTimeTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.toAccount).toEqual(false);
            expect(err.failedInputs.valueFunction).toEqual(true);
            expect(err.failedInputs.date).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying numerous deficiencies as an issue when the input contains insufficient information", function(done) {
        PersonalFinanceEngine.createOneTimeTransfer(insufficientInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.toAccount).toEqual(true);
            expect(err.failedInputs.valueFunction).toEqual(true);
            expect(err.failedInputs.date).toEqual(true);
            done();
          });
      });

      it("should place the transferID into the associatedTransfers arrays on the respective FinancialAccounts if the transfer is valid.", function(done) {
        PersonalFinanceEngine.createOneTimeTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(testFinancialAccount1.associatedTransfers).toContain(transferID);
            expect(testFinancialAccount2.associatedTransfers).toContain(transferID);
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });
    });

    describe("Edit", function() {

      var err;
      var originalTransferID;
      var returnedTransferID;
      var originalTransferInput;
      var newTransferInput;
      var badTransferInput;

      beforeEach(function() {
        testFinancialAccount1 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        testFinancialAccount2 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test2",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        testFinancialAccount3 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test3",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        originalTransferInput = {
          fromAccount: testFinancialAccount1,
          toAccount: testFinancialAccount2,
          valueFunction: function(){return 1000;},
          date: new Date("1970-01-01"),
        };

        newTransferInput = {
          fromAccount: testFinancialAccount1,
          toAccount: testFinancialAccount3,
          valueFunction: function(){return 2000;},
          date: new Date("1975-01-01"),
        };

        badTransferInput = {
          fromAccount: "no",
          toAccount: "no",
          valueFunction: "no",
          date: "no",
        };
      });

      it("should have an editOneTimeTransfer method on the PersonalFinanceEngine scope.", function(done) {
        expect(PersonalFinanceEngine.editOneTimeTransfer).toEqual(jasmine.any(Function));
        done();
      });

      it("should update the TransferDefinition and return the same transferID when we call editOneTimeTransfer() with valid input", function(done) {
        PersonalFinanceEngine.createOneTimeTransfer(originalTransferInput)
          .then( function (returnID) {
            originalTransferID = returnID;
            expect(originalTransferID).toBeDefined();
            return PersonalFinanceEngine.editOneTimeTransfer(originalTransferID, newTransferInput);
          })
          .then( function (returnID) {
            returnedTransferID = returnID;
            expect(returnedTransferID).toBeDefined();
            expect(returnedTransferID).toEqual(originalTransferID);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].fromAccount).toEqual(testFinancialAccount1);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].toAccount).toEqual(testFinancialAccount3);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].valueFunction()).toEqual(2000);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].date).toEqual(newTransferInput.date);
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      it("should not update the TransferDefinition and return an err object when we call editOneTimeTransfer() with bad input", function(done) {
        PersonalFinanceEngine.createOneTimeTransfer(originalTransferInput)
          .then( function (returnID) {
            originalTransferID = returnID;
            expect(originalTransferID).toBeDefined();
            return PersonalFinanceEngine.editOneTimeTransfer(originalTransferID, badTransferInput);
          })
          .then( function (returnID) {
            returnedTransferID = returnID;
            expect(returnedTransferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.toAccount).toEqual(true);
            expect(err.failedInputs.valueFunction).toEqual(true);
            expect(err.failedInputs.date).toEqual(true);
            done();
          });
      });

      it("should update the associatedTransfers arrays on the old FinancialAccounts if either are changed.", function(done) {
        PersonalFinanceEngine.createOneTimeTransfer(originalTransferInput)
          .then( function (returnID) {
            originalTransferID = returnID;
            expect(originalTransferID).toBeDefined();
            return PersonalFinanceEngine.editOneTimeTransfer(originalTransferID, newTransferInput);
          })
          .then( function (returnID) {
            returnedTransferID = returnID;
            expect(testFinancialAccount1.associatedTransfers).toContain(originalTransferID);
            expect(testFinancialAccount3.associatedTransfers).toContain(originalTransferID);
            expect(testFinancialAccount2.associatedTransfers).not.toContain(originalTransferID);
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });
    });
  });


  describe("Public Recurring Transfer Interface", function() {

    describe("Create", function(){

      var err;
      var transferID;
      var transferInput;
      var insufficientInput;

      beforeEach(function() {
        testFinancialAccount1 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        testFinancialAccount2 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test2",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        transferInput = {
          fromAccount: testFinancialAccount1,
          toAccount: testFinancialAccount2,
          valueFunction: function(){return 1000;},
          startDate: new Date("1970-01-01"),
          endDate: new Date("1975-01-01"),
          frequency: "Monthly",
        };

        insufficientInput = {
          value: function(){return 1000;},
          startDate: new Date("1970-01-01"),
        };
      });

      it("should have an createRecurringTransfer method on the PersonalFinanceEngine scope.", function(done) {
        expect(PersonalFinanceEngine.createRecurringTransfer).toEqual(jasmine.any(Function));
        done();
      });

      it("should return the UUID of the TransferDefinition when we call createOneTimeTransfer() with valid input", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      it("should place the created TransferDefinition into the transferDefinitions map", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID]).toEqual(jasmine.any(Object));
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      it("should return an error object identifying the respective dates as an issue when the input contains a malformed date", function(done) {
        transferInput.startDate = "abc";
        transferInput.endDate = "def";
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.toAccount).toEqual(false);
            expect(err.failedInputs.valueFunction).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.endDate).toEqual(true);
            expect(err.failedInputs.frequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the valueFunction as an issue when the input contains a malformed valueFunction", function(done) {
        transferInput.valueFunction = "abc";
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.toAccount).toEqual(false);
            expect(err.failedInputs.valueFunction).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.endDate).toEqual(false);
            expect(err.failedInputs.frequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the frequency as an issue when the input contains a malformed frequency", function(done) {
        transferInput.frequency = "abc";
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.toAccount).toEqual(false);
            expect(err.failedInputs.valueFunction).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.endDate).toEqual(false);
            expect(err.failedInputs.frequency).toEqual(true);
            done();
          });
      });

      it("should return an error object identifying numerous deficiencies as an issue when the input contains insufficient information", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(insufficientInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.toAccount).toEqual(true);
            expect(err.failedInputs.valueFunction).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.endDate).toEqual(true);
            expect(err.failedInputs.frequency).toEqual(true);
            done();
          });
      });

      it("should place the transferID into the associatedTransfers arrays on the respective FinancialAccounts.", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(testFinancialAccount1.associatedTransfers).toContain(transferID);
            expect(testFinancialAccount2.associatedTransfers).toContain(transferID);
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });
    });


    describe("Edit", function() {

      var err;
      var originalTransferID;
      var returnedTransferID;
      var originalTransferInput;
      var newTransferInput;
      var badTransferInput;

      beforeEach(function() {
        testFinancialAccount1 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        testFinancialAccount2 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test2",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        testFinancialAccount3 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test3",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        originalTransferInput = {
          fromAccount: testFinancialAccount1,
          toAccount: testFinancialAccount2,
          valueFunction: function(){return 1000;},
          startDate: new Date("1970-01-01"),
          endDate: new Date("1975-01-01"),
          frequency: "Monthly",
        };

        newTransferInput = {
          fromAccount: testFinancialAccount1,
          toAccount: testFinancialAccount3,
          valueFunction: function(){return 2000;},
          startDate: new Date("1975-01-01"),
          endDate: new Date("1980-01-01"),
          frequency: "Biweekly",
        };

        badTransferInput = {
          fromAccount: "no",
          toAccount: "no",
          valueFunction: "no",
          startDate: "no",
          endDatedate: "No",
          frequency: "no"
        };
      });

      it("should have an editRecurringTransfer method on the PersonalFinanceEngine scope.", function(done) {
        expect(PersonalFinanceEngine.editRecurringTransfer).toEqual(jasmine.any(Function));
        done();
      });

      it("should update the TransferDefinition and return the same transferID when we call editOneTimeTransfer() with valid input", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(originalTransferInput)
          .then( function (returnID) {
            originalTransferID = returnID;
            expect(originalTransferID).toBeDefined();
            return PersonalFinanceEngine.editRecurringTransfer(originalTransferID, newTransferInput);
          })
          .then( function (returnID) {
            returnedTransferID = returnID;
            expect(returnedTransferID).toBeDefined();
            expect(returnedTransferID).toEqual(originalTransferID);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].fromAccount).toEqual(testFinancialAccount1);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].toAccount).toEqual(testFinancialAccount3);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].valueFunction()).toEqual(2000);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].startDate).toEqual(newTransferInput.startDate);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].endDate).toEqual(newTransferInput.endDate);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[originalTransferID].frequency).toEqual(newTransferInput.frequency);
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      it("should not update the TransferDefinition and return an err object when we call editOneTimeTransfer() with bad input", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(originalTransferInput)
          .then( function (returnID) {
            originalTransferID = returnID;
            expect(originalTransferID).toBeDefined();
            return PersonalFinanceEngine.editRecurringTransfer(originalTransferID, badTransferInput);
          })
          .then( function (returnID) {
            returnedTransferID = returnID;
            expect(returnedTransferID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.toAccount).toEqual(true);
            expect(err.failedInputs.valueFunction).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.endDate).toEqual(true);
            expect(err.failedInputs.frequency).toEqual(true);
            done();
          });
      });

      it("should update the associatedTransfers arrays on the old FinancialAccounts if either are changed.", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(originalTransferInput)
          .then( function (returnID) {
            originalTransferID = returnID;
            expect(originalTransferID).toBeDefined();
            return PersonalFinanceEngine.editRecurringTransfer(originalTransferID, newTransferInput);
          })
          .then( function (returnID) {
            returnedTransferID = returnID;
            expect(returnedTransferID).toBeDefined();
            expect(testFinancialAccount1.associatedTransfers).toContain(originalTransferID);
            expect(testFinancialAccount3.associatedTransfers).toContain(originalTransferID);
            expect(testFinancialAccount2.associatedTransfers).not.toContain(originalTransferID);
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });
    });
  });

  describe("Shared Transfer Interface", function(){
    describe("Delete", function() {

      var err;
      var transferID;
      var returnedTransferID;
      var transferInput;

      beforeEach(function() {
        testFinancialAccount1 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        testFinancialAccount2 = new PersonalFinanceEngine.__test__.FinancialAccount({
          name: "Test2",
          startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0
        });

        transferInput = {
          fromAccount: testFinancialAccount1,
          toAccount: testFinancialAccount2,
          valueFunction: function(){return 1000;},
          startDate: new Date("1970-01-01"),
          endDate: new Date("1975-01-01"),
          frequency: "Monthly",
        };
      });

      it("should have a deleteTransfer method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.deleteTransfer).toEqual(jasmine.any(Function));
      });

      it("should successfully remove the TransferDefinition matching transferID when we call deleteTransfer()", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).toBeDefined();
            return PersonalFinanceEngine.deleteTransfer(transferID, transferInput);
          })
          .then( function (returnID) {
            returnedTransferID = returnID;
            expect(returnedTransferID).toEqual(null);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID]).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });

      it("should remove the transferID from the associatedTransfers arrays on the respective FinancialAccounts.", function(done) {
        PersonalFinanceEngine.createRecurringTransfer(transferInput)
          .then( function (returnID) {
            transferID = returnID;
            expect(transferID).toBeDefined();
            return PersonalFinanceEngine.deleteTransfer(transferID, transferInput);
          })
          .then( function (returnID) {
            returnedTransferID = returnID;
            expect(returnedTransferID).toEqual(null);
            expect(testFinancialAccount1.associatedTransfers).not.toContain(transferID);
            expect(testFinancialAccount2.associatedTransfers).not.toContain(transferID);
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      });
    });
  });
});

describe("Transfer defintion object constructors", function() {

  describe("TransferDefinition constructor", function() {

    var testTransferDefinition;
    var testFinancialAccount1;
    var testFinancialAccount2;
    var transferValue = 1000;

    beforeEach(function() {
      testFinancialAccount1 = new PersonalFinanceEngine.__test__.FinancialAccount({
        name: "Test",
        startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0
      });

      testFinancialAccount2 = new PersonalFinanceEngine.__test__.FinancialAccount({
        name: "Test2",
        startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0
      });

      testTransferDefinition = new PersonalFinanceEngine.__test__.TransferDefinition(testFinancialAccount1, testFinancialAccount2, function(){return transferValue});
    });

    it("should have a TransferDefinition constructor on the __test__ scope.", function() {
      expect(PersonalFinanceEngine.__test__.TransferDefinition).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.TransferDefinition).not.toBeDefined();
    });

    it("should have the desired properties in the TransferDefinition object", function() {
      expect(testTransferDefinition.fromAccount).toBeDefined();
      expect(testTransferDefinition.toAccount).toBeDefined();
      expect(testTransferDefinition.valueFunction).toEqual(jasmine.any(Function));
    });

    it("should return the set transfer value when the value function is called", function() {
      expect(testTransferDefinition.valueFunction()).toEqual(transferValue);
    });

    it("should return a direct reference to fromAccount and toAccount", function() {
      expect(testTransferDefinition.fromAccount === testFinancialAccount1).toEqual(true);
      expect(testTransferDefinition.toAccount === testFinancialAccount2).toEqual(true);
    });

  });



  describe("oneTimeTransferDefinition constructor", function() {

    var testOneTimeTransferDefinition;
    var testFinancialAccount1;
    var testFinancialAccount2;
    var transferValue = 1000;
    var date = Date("1970-01-01")

    beforeEach(function() {
      testFinancialAccount1 = new PersonalFinanceEngine.__test__.FinancialAccount({
        name: "Test",
        startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0
      });

      testFinancialAccount2 = new PersonalFinanceEngine.__test__.FinancialAccount({
        name: "Test2",
        startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0
      });

      testOneTimeTransferDefinition = new PersonalFinanceEngine.__test__.OneTimeTransferDefinition(testFinancialAccount1, testFinancialAccount2, function(){return transferValue}, date);
    });

    it("should have a OneTimeTransferDefinition constructor on the __test__ scope.", function() {
      expect(PersonalFinanceEngine.__test__.OneTimeTransferDefinition).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.OneTimeTransferDefinition).not.toBeDefined();
    });

    it("should have the desired properties in the OneTimeTransferDefinition object", function() {
      expect(testOneTimeTransferDefinition.type).toEqual("OneTime");
      expect(testOneTimeTransferDefinition.fromAccount).toBeDefined();
      expect(testOneTimeTransferDefinition.toAccount).toBeDefined();
      expect(testOneTimeTransferDefinition.valueFunction).toEqual(jasmine.any(Function));
      expect(testOneTimeTransferDefinition.date).toEqual(date);
    });

    it("should return the set transfer value when the value function is called", function() {
      expect(testOneTimeTransferDefinition.valueFunction()).toEqual(transferValue);
    });

    it("should return a direct reference to fromAccount and toAccount", function() {
      expect(testOneTimeTransferDefinition.fromAccount === testFinancialAccount1).toEqual(true);
      expect(testOneTimeTransferDefinition.toAccount === testFinancialAccount2).toEqual(true);
    });

  });


  describe("RecurringTransferDefinition constructor", function() {

    var testRecurringTransferDefinition;
    var testFinancialAccount1;
    var testFinancialAccount2;
    var transferValue = 1000;
    var startDate = Date("1970-01-01");
    var endDate = Date("1971-01-01");
    var frequency = "Monthly";

    beforeEach(function() {
      testFinancialAccount1 = new PersonalFinanceEngine.__test__.FinancialAccount({
        name: "Test",
        startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0
      });

      testFinancialAccount2 = new PersonalFinanceEngine.__test__.FinancialAccount({
        name: "Test2",
        startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0
      });

      testRecurringTransferDefinition = new PersonalFinanceEngine.__test__.RecurringTransferDefinition(testFinancialAccount1, testFinancialAccount2, function(){return transferValue}, startDate, endDate, frequency);
    });

    it("should have a RecurringTransferDefinition constructor on the __test__ scope.", function() {
      expect(PersonalFinanceEngine.__test__.RecurringTransferDefinition).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.RecurringTransferDefinition).not.toBeDefined();
    });

    it("should have the desired properties in the RecurringTransferDefinition object", function() {
      expect(testRecurringTransferDefinition.type).toEqual("Recurring");
      expect(testRecurringTransferDefinition.fromAccount).toBeDefined();
      expect(testRecurringTransferDefinition.toAccount).toBeDefined();
      expect(testRecurringTransferDefinition.valueFunction).toEqual(jasmine.any(Function));
      expect(testRecurringTransferDefinition.startDate).toEqual(startDate);
      expect(testRecurringTransferDefinition.endDate).toEqual(endDate);
    });

    it("should return the set transfer value when the value function is called", function() {
      expect(testRecurringTransferDefinition.valueFunction()).toEqual(transferValue);
    });

    it("should return a direct reference to fromAccount and toAccount", function() {
      expect(testRecurringTransferDefinition.fromAccount === testFinancialAccount1).toEqual(true);
      expect(testRecurringTransferDefinition.toAccount === testFinancialAccount2).toEqual(true);
    });
  });

  it("should have a private transferDefinitions array on the __test__ scope", function() {
    expect(PersonalFinanceEngine.__test__.transferDefinitions).toBeDefined();
    expect(PersonalFinanceEngine.transferDefinitions).not.toBeDefined();
  });
});
