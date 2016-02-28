"use strict";
describe("FinancialObject public methods and constructors", function() {

  it("should have a chequingAccount object on the PersonalFinanceEngine scope.", function() {
    expect(PersonalFinanceEngine.chequingAccount).toEqual(jasmine.any(Object));
  });

  describe("Assets", function() {

    it("should have an assets map on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.assets).toBeDefined();
      expect(PersonalFinanceEngine.assets).toEqual(jasmine.any(Object));
    });

    describe("createAsset()", function() {

      var assetInput;
      var assetID;
      var laterAssetInput;
      var laterAssetID;
      var initialTransferID;
      var err;

      beforeEach(function() {
        assetInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05
        };

        laterAssetInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1975-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05
        };
      });

      it("should have a createAsset method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.createAsset).toEqual(jasmine.any(Function));
      });

      it("should return the UUID of the Asset when we call createAsset() with valid input", function(done) {
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(returnID).toBeDefined();
            expect(PersonalFinanceEngine.assets[returnID].associatedTransfers.length).toBeGreaterThan(0);
            expect(PersonalFinanceEngine.assets[returnID].associatedTransfers).toContain(PersonalFinanceEngine.assets[returnID].initialTransferID);

            return PersonalFinanceEngine.deleteAsset(returnID);
          })
          .then(function(){
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

      it("should place the created Asset into the assets map", function(done) {
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(PersonalFinanceEngine.assets[returnID].ID).toEqual(returnID);

            return PersonalFinanceEngine.deleteAsset(returnID);
          })
          .then(function(){
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

      it("should create a transfer definition for the initial value transfer.", function(done) {
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(PersonalFinanceEngine.assets[returnID].ID).toEqual(returnID);
            initialTransferID = PersonalFinanceEngine.assets[returnID].initialTransferID;
            expect(PersonalFinanceEngine.__test__.transferDefinitions[initialTransferID].toAccount).toEqual(PersonalFinanceEngine.assets[returnID]);

            return PersonalFinanceEngine.deleteAsset(returnID);
          })
          .then(function(){
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

      it("should return an error object identifying the name as an issue when the input contains a bad name value", function(done) {
        assetInput.name = function(){};
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(returnID).toEqual(undefined);
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(true);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the subType as an issue when the input contains a bad subType value", function(done) {
        assetInput.subType = 1.0;
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(returnID).toEqual(undefined);
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the startDate as an issue when the input contains a bad startDate value", function(done) {
        assetInput.startDate = "abc";
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(returnID).toEqual(undefined);
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the fromAccount as an issue when the input contains a bad fromAccount value", function(done) {
        assetInput.fromAccount = "abc";
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(returnID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the fromAccount as an issue when the startDate on fromAccount is later than this asset's startDate", function(done) {
        PersonalFinanceEngine.createAsset(laterAssetInput)
          .then( function(returnID) {
            laterAssetID = returnID;
            assetInput.fromAccount = PersonalFinanceEngine.assets[laterAssetID];
            return PersonalFinanceEngine.createAsset(assetInput);
          })
          .then( function(returnID) {
            assetID = returnID;
            expect(assetID).not.toBeDefined();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
          })
          .then( function() {
            return PersonalFinanceEngine.deleteAsset(laterAssetID);
          })
          .then( function() {
            return PersonalFinanceEngine.deleteAsset(assetID);
          })
          .then( function() {
            done();
          })
      });

      it("should return an error object identifying the initialValue as an issue when the input contains a bad initialValue", function(done) {
        assetInput.initialValue = "abc";
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(returnID).toEqual(undefined);
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the accrualRate as an issue when the input contains a bad accrualRate value", function(done) {
        assetInput.accrualRate = "abc";
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(returnID).toEqual(undefined);
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(true);
            done();
          });
      });

      it("should return an error object identifying numerous deficiencies as an issue when the input contains insufficient information", function(done) {
        assetInput = {name: "test"};
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID) {
            expect(returnID).toEqual(undefined);
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(true);
            done();
          });
      });
    });

    describe("editAsset()", function() {

      var assetInput;
      var newAssetInput;
      var badAssetInput;
      var assetID;
      var edittedAssetID;
      var initialTransferID;
      var err;

      beforeEach(function() {
        assetInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05
        };

        newAssetInput = {
          name: "Test",
          subType: "Property",
          startDate: new Date("1975-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 0,  // Start balance of $1000
          accrualRate: 0.10
        };

        badAssetInput = {};
      });

      it("should have an editAsset method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.editAsset).toEqual(jasmine.any(Function));
      });

      it("should return the UUID of the Asset back when we call editAsset() with valid input", function(done) {
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID){
            assetID = returnID;
            return PersonalFinanceEngine.editAsset(assetID, newAssetInput);
          })
          .then( function(returnID) {
            edittedAssetID = returnID;
            expect(edittedAssetID).toBeDefined();
            expect(edittedAssetID).toEqual(assetID);

            return PersonalFinanceEngine.deleteAsset(returnID);
          })
          .then(function(){
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

      it("should update the values if the Asset when we call editAsset() with valid input", function(done) {
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID){
            assetID = returnID;
            return PersonalFinanceEngine.editAsset(assetID, newAssetInput);
          })
          .then( function(returnID) {
            edittedAssetID = returnID;
            expect(PersonalFinanceEngine.assets[edittedAssetID]).not.toEqual(null);
            expect(PersonalFinanceEngine.assets[edittedAssetID].name).toEqual(newAssetInput.name);
            expect(PersonalFinanceEngine.assets[edittedAssetID].subType).toEqual(newAssetInput.subType);
            expect(PersonalFinanceEngine.assets[edittedAssetID].startDate).toEqual(newAssetInput.startDate);
            expect(PersonalFinanceEngine.assets[edittedAssetID].accrualRate).toEqual(newAssetInput.accrualRate);

            return PersonalFinanceEngine.deleteAsset(returnID);
          })
          .then(function(){
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

      it("should update the transfer definition for the initial value transfer if necessary", function(done) {
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID){
            assetID = returnID;
            return PersonalFinanceEngine.editAsset(assetID, newAssetInput);
          })
          .then( function(returnID) {
            edittedAssetID = returnID;
            expect(PersonalFinanceEngine.assets[returnID].ID).toEqual(returnID);
            initialTransferID = PersonalFinanceEngine.assets[returnID].initialTransferID;
            expect(PersonalFinanceEngine.__test__.transferDefinitions[initialTransferID].toAccount).toEqual(PersonalFinanceEngine.assets[returnID]);

            return PersonalFinanceEngine.deleteAsset(returnID);
          })
          .then(function(){
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

      it("should return an error object identifying numerous deficiencies as an issue when the input contains insufficient information", function(done) {
        assetInput = {};
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID){
            assetID = returnID;
            return PersonalFinanceEngine.editAsset(assetID, badAssetInput);
          })
          .then( function(returnID) {
            edittedAssetID = returnID;
            expect(edittedAssetID).not.toBeDefined();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(true);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(true);
          })
          .then( function () {
            return PersonalFinanceEngine.deleteAsset(assetID);
          })
          .then(function(){
            done();
          })
      });
    });

    describe("deleteAsset()", function() {

      var assetInput;
      var assetID;
      var returnedAssetID;
      var err;

      beforeEach(function() {
        assetInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05
        };
      });

      it("should have a deleteAsset method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.deleteAsset).toEqual(jasmine.any(Function));
      });

      it("should properly delete the asset with the associated assetID and remove the asset from the assets map", function(done) {
        PersonalFinanceEngine.createAsset(assetInput)
          .then( function(returnID){
            assetID = returnID;
            expect(PersonalFinanceEngine.assets[assetID]).toBeDefined();
            return PersonalFinanceEngine.deleteAsset(assetID);
          })
          .then(
            function(returnID){
              returnedAssetID = returnID;
              expect(PersonalFinanceEngine.assets[assetID]).not.toBeDefined();
              expect(err).toEqual(undefined);
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

      describe("associatedTransfers", function() {

        var assetInput1;
        var assetInput2;
        var assetID1;
        var assetID2;
        var transferInput;
        var transferID;
        var err;

        beforeEach(function() {
          assetInput1 = {
            name: "Test1",
            subType: "",
            startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
            fromAccount: "external",
            initialValue: 1000,  // Start balance of $1000
            accrualRate: 0.05,
          };

          assetInput2 = {
            name: "Test2",
            subType: "",
            startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
            fromAccount: "external",
            initialValue: 1000,  // Start balance of $1000
            accrualRate: 0.05,
          };
        });

        it("should properly change the financialAccount references on any associated transfers to 'external'", function(done) {
          PersonalFinanceEngine.createAsset(assetInput1)
            .then( function(returnID){
              assetID1 = returnID;
              expect(PersonalFinanceEngine.assets[assetID1]).toBeDefined();
              return PersonalFinanceEngine.createAsset(assetInput2);
            })
            .then( function(returnID){
              assetID2 = returnID;
              expect(PersonalFinanceEngine.assets[assetID2]).toBeDefined();

              transferInput = {
                fromAccount: PersonalFinanceEngine.assets[assetID1],
                toAccount: PersonalFinanceEngine.assets[assetID2],
                valueFunction: function(){return 2000;},
                date: new Date("1975-01-01"),
              };
              return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
            })
            .then( function(returnID) {
              transferID = returnID;
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].fromAccount.ID).toEqual(assetID1);
              return PersonalFinanceEngine.deleteAsset(assetID1);
            })
            .then( function(returnID) {
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].fromAccount).toEqual("external");

              return PersonalFinanceEngine.deleteAsset(assetID2);
            })
            .then(function(){
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

        it("should delete the transfer if the deleted account is the only non-external account reference it had.", function(done) {
          PersonalFinanceEngine.createAsset(assetInput1)
            .then( function(returnID){
              assetID1 = returnID;
              expect(PersonalFinanceEngine.assets[assetID1]).toBeDefined();
              return PersonalFinanceEngine.createAsset(assetInput2);
            })
            .then( function(returnID){
              assetID2 = returnID;
              expect(PersonalFinanceEngine.assets[assetID2]).toBeDefined();

              transferInput = {
                fromAccount: PersonalFinanceEngine.assets[assetID1],
                toAccount: "external",
                valueFunction: function(){return 2000;},
                date: new Date("1975-01-01"),
              };
              return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
            })
            .then( function(returnID) {
              transferID = returnID;
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].fromAccount.ID).toEqual(assetID1);
              return PersonalFinanceEngine.deleteAsset(assetID1);
            })
            .then( function(returnID) {
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID]).not.toBeDefined();

              return PersonalFinanceEngine.deleteAsset(assetID2);
            })
            .then(function(){
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
    });
  });

  describe("Investments", function() {

    it("should have an investmentAccounts map on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.investmentAccounts).toBeDefined();
      expect(PersonalFinanceEngine.investmentAccounts).toEqual(jasmine.any(Object));
    });

    describe("createInvestment()", function() {

      var investmentInput;
      var laterInvestmentInput;
      var investmentID;
      var laterInvestmentID;
      var initialTransferID;
      var accrualTransferID;
      var err;

      beforeEach(function() {
        investmentInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly",
        };

        laterInvestmentInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1975-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly",
        };
      });

      it("should have a createInvestment method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.createInvestment).toEqual(jasmine.any(Function));
      });

      it("should return the UUID of the Investment when we call createInvestment() with valid input", function(done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).toBeDefined();
            expect(PersonalFinanceEngine.investmentAccounts[returnID].associatedTransfers.length).toBeGreaterThan(0);
            expect(PersonalFinanceEngine.investmentAccounts[returnID].associatedTransfers).toContain(PersonalFinanceEngine.investmentAccounts[returnID].initialTransferID);
            expect(PersonalFinanceEngine.investmentAccounts[returnID].associatedTransfers).toContain(PersonalFinanceEngine.investmentAccounts[returnID].accrualTransferID);

            return PersonalFinanceEngine.deleteInvestment(returnID);
          })
          .then(function(){
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

      it("should place the created investmentInput into the investmentAccounts map", function(done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function(returnID) {
            investmentID = returnID;
            expect(PersonalFinanceEngine.investmentAccounts[investmentID].ID).toEqual(investmentID);

            return PersonalFinanceEngine.deleteInvestment(returnID);
          })
          .then(function(){
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

      it("should create a transfer definition for the initial value and accrualBuffer payment transfers", function(done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function(returnID) {
            investmentID = returnID;
            expect(PersonalFinanceEngine.investmentAccounts[investmentID].ID).toEqual(investmentID);
            initialTransferID = PersonalFinanceEngine.investmentAccounts[investmentID].initialTransferID;
            accrualTransferID = PersonalFinanceEngine.investmentAccounts[investmentID].accrualTransferID;
            expect(PersonalFinanceEngine.__test__.transferDefinitions[initialTransferID].toAccount).toEqual(PersonalFinanceEngine.investmentAccounts[investmentID]);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[accrualTransferID].toAccount).toEqual(PersonalFinanceEngine.investmentAccounts[investmentID]);

            return PersonalFinanceEngine.deleteInvestment(returnID);
          })
          .then(function(){
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

      it("should return an error object identifying the name as an issue when the input contains a bad name value", function(done) {
        investmentInput.name = 1.0;
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(true);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the subType as an issue when the input contains a bad subType value", function(done) {
        investmentInput.subType = 1.0;
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the startDate as an issue when the input contains a bad startDate value", function(done) {
        investmentInput.startDate = "abc";
        investmentInput.endDate = "abc";
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the fromAccount as an issue when the input contains a bad fromAccount value", function(done) {
        investmentInput.fromAccount = "abc";
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the fromAccount as an issue when the startDate on fromAccount is later than this investment's startDate", function(done) {
        PersonalFinanceEngine.createInvestment(laterInvestmentInput)
          .then( function(returnID) {
            laterInvestmentID = returnID;
            investmentInput.fromAccount = PersonalFinanceEngine.investmentAccounts[laterInvestmentID];
            return PersonalFinanceEngine.createInvestment(investmentInput);
          })
          .then( function(returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
          })
          .then( function() {
            return PersonalFinanceEngine.deleteInvestment(laterInvestmentID);
          })
          .then( function() {
            return PersonalFinanceEngine.deleteInvestment(investmentID);
          })
          .then( function() {
            done();
          })
      });

      it("should return an error object identifying the initialValue as an issue when the input contains a bad initialValue", function(done) {
        investmentInput.initialValue = "abc";
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the accrualRate as an issue when the input contains a bad accrualRate value", function(done) {
        investmentInput.accrualRate = "abc";
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(true);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the accrualPaymentFrequency as an issue when the input contains a bad accrualPaymentFrequency value", function(done) {
        investmentInput.accrualPaymentFrequency = "abc";
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(true);
            done();
          });
      });

      it("should return an error object identifying numerous deficiencies as an issue when the input contains insufficient information", function(done) {
        investmentInput = {};
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            expect(investmentID).not.toBeDefined();
            done();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(true);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(true);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(true);
            done();
          });
      });
    });

    describe("editInvestment()", function() {

      var investmentInput;
      var newInvestmentInput;
      var badInvestmentInput;
      var investmentID;
      var edittedInvestmentID;
      var initialTransferID;
      var accrualTransferID;
      var err;

      beforeEach(function() {
        investmentInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly"
        };

        newInvestmentInput = {
          name: "Test",
          subType: "Mutual Fund",
          startDate: new Date("1975-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 500,  // Start balance of $1000
          accrualRate: 0.075,
          accrualPaymentFrequency: "Monthly"
        };

        badInvestmentInput = {};
      });

      it("should have an editInvstment method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.editInvestment).toEqual(jasmine.any(Function));
      });

      it("should return the UUID of the Investment back when we call editInvestment() with valid input", function(done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function (returnID) {
            investmentID = returnID;
            return PersonalFinanceEngine.editInvestment(investmentID, newInvestmentInput);
          })
          .then( function (returnID) {
            edittedInvestmentID = returnID;
            expect(edittedInvestmentID).toBeDefined();
            expect(edittedInvestmentID).toEqual(investmentID);

            return PersonalFinanceEngine.deleteInvestment(returnID);
          })
          .then(function(){
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

      it("should update the values if the Investment when we call editInvestment() with valid input", function(done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function(returnID) {
            investmentID = returnID;
            return PersonalFinanceEngine.editInvestment(investmentID, newInvestmentInput);
          })
          .then( function(returnID) {
            expect(investmentID).toEqual(returnID);
            expect(PersonalFinanceEngine.investmentAccounts[investmentID]).not.toEqual(null);
            expect(PersonalFinanceEngine.investmentAccounts[investmentID].name).toEqual(newInvestmentInput.name);
            expect(PersonalFinanceEngine.investmentAccounts[investmentID].subType).toEqual(newInvestmentInput.subType);
            expect(PersonalFinanceEngine.investmentAccounts[investmentID].startDate).toEqual(newInvestmentInput.startDate);
            expect(PersonalFinanceEngine.investmentAccounts[investmentID].accrualRate).toEqual(newInvestmentInput.accrualRate);

            return PersonalFinanceEngine.deleteInvestment(returnID);
          })
          .then(function(){
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

      it("should edit the transfer definition for the initial value and accrualBuffer payment transfers if necessary", function(done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function(returnID) {
            investmentID = returnID;
            return PersonalFinanceEngine.editInvestment(investmentID, newInvestmentInput);
          })
          .then( function(returnID) {
            expect(investmentID).toEqual(returnID);
            initialTransferID = PersonalFinanceEngine.investmentAccounts[investmentID].initialTransferID;
            accrualTransferID = PersonalFinanceEngine.investmentAccounts[investmentID].accrualTransferID;
            expect(PersonalFinanceEngine.__test__.transferDefinitions[initialTransferID].toAccount).toEqual(PersonalFinanceEngine.investmentAccounts[investmentID]);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[accrualTransferID].toAccount).toEqual(PersonalFinanceEngine.investmentAccounts[investmentID]);

            return PersonalFinanceEngine.deleteInvestment(returnID);
          })
          .then(function(){
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

      it("should return an error object identifying numerous deficiencies as an issue when the input contains insufficient information", function(done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function(returnID) {
            investmentID = returnID;
            return PersonalFinanceEngine.editInvestment(investmentID, badInvestmentInput);
          })
          .then( function(returnID) {
            expect(returnID).not.toBeDefined();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(true);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(true);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(true);
          })
          .then( function () {
            return PersonalFinanceEngine.deleteInvestment(investmentID);
          })
          .then(function(){
            done();
          })
      });
    });

    describe("deleteInvestment()", function() {

      var investmentInput;
      var investmentID;
      var returnedInvestmentID;
      var err;

      beforeEach(function() {
        investmentInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly"
        };
      });

      it("should have a deleteInvestment method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.deleteInvestment).toEqual(jasmine.any(Function));
      });

      it("should properly delete the investment with the associated investmentID and remove the investment from the investmentAccounts map", function(done) {
        PersonalFinanceEngine.createInvestment(investmentInput)
          .then( function(returnID) {
            investmentID = returnID;
            expect(PersonalFinanceEngine.investmentAccounts[investmentID]).toBeDefined();
            return PersonalFinanceEngine.deleteInvestment(investmentID);
          })
          .then( function(returnID) {
            expect(returnID).toEqual(null);
            expect(PersonalFinanceEngine.investmentAccounts[investmentID]).not.toBeDefined();
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

      describe("associatedTransfers", function() {

        var investmentInput1;
        var investmentInput2;
        var investmentID1;
        var investmentID2;
        var transferInput;
        var transferID;
        var err;

        beforeEach(function() {
          investmentInput1 = {
            name: "Test1",
            subType: "",
            startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
            fromAccount: "external",
            initialValue: 1000,  // Start balance of $1000
            accrualRate: 0.05,
            accrualPaymentFrequency: "Monthly"
          };

          investmentInput2 = {
            name: "Test2",
            subType: "",
            startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
            fromAccount: "external",
            initialValue: 1000,  // Start balance of $1000
            accrualRate: 0.05,
            accrualPaymentFrequency: "Monthly"
          };
        });

        it("should properly change the financialAccount references on any associated transfers to 'external'", function(done) {
          PersonalFinanceEngine.createInvestment(investmentInput1)
            .then( function (returnID) {
              investmentID1 = returnID;
              return PersonalFinanceEngine.createInvestment(investmentInput2);
            })
            .then( function (returnID) {
              investmentID2 = returnID;
              transferInput = {
                fromAccount: PersonalFinanceEngine.investmentAccounts[investmentID1],
                toAccount: PersonalFinanceEngine.investmentAccounts[investmentID2],
                valueFunction: function(){return 2000;},
                date: new Date("1975-01-01"),
              };
              return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
            })
            .then( function (returnID) {
              transferID = returnID;
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].fromAccount.ID).toEqual(investmentID1);
              return PersonalFinanceEngine.deleteInvestment(investmentID1);
            })
            .then( function(returnID) {
              expect(returnID).toEqual(null);
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].fromAccount).toEqual("external");

              return PersonalFinanceEngine.deleteInvestment(investmentID2);
            })
            .then(function(){
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

        it("should delete the transfer if the deleted account is the only non-external account reference it had.", function(done) {
          PersonalFinanceEngine.createInvestment(investmentInput1)
            .then( function (returnID) {
              investmentID1 = returnID;
              return PersonalFinanceEngine.createInvestment(investmentInput2);
            })
            .then( function (returnID) {
              investmentID2 = returnID;
              transferInput = {
                fromAccount: "external",
                toAccount: PersonalFinanceEngine.investmentAccounts[investmentID2],
                valueFunction: function(){return 2000;},
                date: new Date("1975-01-01"),
              };
              return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
            })
            .then( function (returnID) {
              transferID = returnID;
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].toAccount.ID).toEqual(investmentID2);
              return PersonalFinanceEngine.deleteInvestment(investmentID2);
            })
            .then( function(returnID) {
              expect(returnID).toEqual(null);
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID]).not.toBeDefined();

              return PersonalFinanceEngine.deleteInvestment(investmentID1);
            })
            .then(function(){
              done();
            })
            .catch( function (err) {
              if (err.name !== "InvalidInputError") {
                throw err;
              };
              expect(err).toEqual(null);
              done();
            });
        })
      });
    });
  });

  describe("Debts", function() {

    it("should have a debtAccounts map on the PersonalFinanceEngine scope.", function() {
      expect(PersonalFinanceEngine.debtAccounts).toBeDefined();
      expect(PersonalFinanceEngine.debtAccounts).toEqual(jasmine.any(Object));
    });

    describe("createDebt()", function() {

      var debtInput;
      var laterDebtInput;
      var debtID;
      var laterDebtID;
      var initialTransferID;
      var accrualTransferID;
      var err;

      beforeEach(function() {
        debtInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly"
        };

        laterDebtInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-02"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly"
        };
      });

      it("should have a createDebt method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.createDebt).toEqual(jasmine.any(Function));
      });

      it("should return the UUID of the Debt when we call createDebt() with valid input", function(done) {
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).toBeDefined();
            expect(PersonalFinanceEngine.debtAccounts[returnID].associatedTransfers.length).toBeGreaterThan(0);
            expect(PersonalFinanceEngine.debtAccounts[returnID].associatedTransfers).toContain(PersonalFinanceEngine.debtAccounts[returnID].initialTransferID);
            expect(PersonalFinanceEngine.debtAccounts[returnID].associatedTransfers).toContain(PersonalFinanceEngine.debtAccounts[returnID].accrualTransferID);

            return PersonalFinanceEngine.deleteDebt(returnID);
          })
          .then(function(){
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

      it("should place the created debtInput into the debtAccounts map", function(done) {
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(PersonalFinanceEngine.debtAccounts[debtID].ID).toEqual(debtID);

            return PersonalFinanceEngine.deleteDebt(returnID);
          })
          .then(function(){
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

      it("should create a transfer definition for the initial value and accrualBuffer payment transfers", function(done) {
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(PersonalFinanceEngine.debtAccounts[debtID].ID).toEqual(debtID);
            initialTransferID = PersonalFinanceEngine.debtAccounts[debtID].initialTransferID;
            accrualTransferID = PersonalFinanceEngine.debtAccounts[debtID].accrualTransferID;
            expect(PersonalFinanceEngine.__test__.transferDefinitions[initialTransferID].toAccount).toEqual(PersonalFinanceEngine.debtAccounts[debtID]);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[accrualTransferID].toAccount).toEqual(PersonalFinanceEngine.debtAccounts[debtID]);

            return PersonalFinanceEngine.deleteDebt(returnID);
          })
          .then(function(){
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

      it("should return an error object identifying the name as an issue when the input contains a bad name value", function(done) {
        debtInput.name = 1.0;
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(true);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the subType as an issue when the input contains a bad subType value", function(done) {
        debtInput.subType = 1.0;
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the startDate as an issue when the input contains a bad startDate value", function(done) {
        debtInput.startDate = "abc";
        debtInput.endDate = "abc";
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the fromAccount as an issue when the input contains a bad fromAccount value", function(done) {
        debtInput.fromAccount = "abc";
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the fromAccount as an issue when the startDate on fromAccount is later than this debt's startDate", function(done) {
        PersonalFinanceEngine.createDebt(laterDebtInput)
          .then( function(returnID) {
            laterDebtID = returnID;
            debtInput.fromAccount = PersonalFinanceEngine.debtAccounts[laterDebtID];
            return PersonalFinanceEngine.createDebt(debtInput);
          })
          .then( function(returnID) {
            debtID = returnID;
            expect(debtID).not.toBeDefined();
          })
          .catch( function(err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(false);
          })
          .then( function() {
            return PersonalFinanceEngine.deleteDebt(laterDebtID);
          })
          .then( function() {
            return PersonalFinanceEngine.deleteDebt(debtID);
          })
          .then( function() {
            done();
          })
      });

      it("should return an error object identifying the initialValue as an issue when the input contains a bad initialValue", function(done) {
        debtInput.initialValue = "abc";
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(false);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying the accrualRate as an issue when the input contains a bad accrualRate value", function(done) {
        debtInput.accrualRate = "abc";
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(false);
            expect(err.failedInputs.subType).toEqual(false);
            expect(err.failedInputs.startDate).toEqual(false);
            expect(err.failedInputs.fromAccount).toEqual(false);
            expect(err.failedInputs.initialValue).toEqual(false);
            expect(err.failedInputs.accrualRate).toEqual(true);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(false);
            done();
          });
      });

      it("should return an error object identifying numerous deficiencies as an issue when the input contains insufficient information", function(done) {
        debtInput = {};
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).not.toBeDefined();
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(true);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(true);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(true);
            done();
          });
      });
    });

    describe("editDebt()", function() {

      var debtInput;
      var newDebtInput;
      var badDebtInput;
      var debtID;
      var edittedDebtID;
      var initialTransferID;
      var accrualTransferID;
      var err;

      beforeEach(function() {
        debtInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Biweekly"
        };

        newDebtInput = {
          name: "Test",
          subType: "Credit Card",
          startDate: new Date("1975-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 500,  // Start balance of $1000
          accrualRate: 0.20,
          accrualPaymentFrequency: "Monthly"
        };

        badDebtInput = {};
      });

      it("should have an editInvstment method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.editDebt).toEqual(jasmine.any(Function));
      });

      it("should return the UUID of the Debt back when we call editDebt() with valid input", function(done) {
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).toBeDefined();
            return PersonalFinanceEngine.editDebt(debtID, newDebtInput);
          })
          .then( function (returnID) {
            edittedDebtID = returnID;
            expect(edittedDebtID).toBeDefined();
            expect(edittedDebtID).toEqual(debtID);

            return PersonalFinanceEngine.deleteDebt(returnID);
          })
          .then(function(){
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

      it("should update the values if the Debt when we call editDebt() with valid input", function(done) {
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).toBeDefined();
            return PersonalFinanceEngine.editDebt(debtID, newDebtInput);
          })
          .then( function (returnID) {
            expect(PersonalFinanceEngine.debtAccounts[debtID]).not.toEqual(null);
            expect(PersonalFinanceEngine.debtAccounts[debtID].name).toEqual(newDebtInput.name);
            expect(PersonalFinanceEngine.debtAccounts[debtID].subType).toEqual(newDebtInput.subType);
            expect(PersonalFinanceEngine.debtAccounts[debtID].startDate).toEqual(newDebtInput.startDate);
            expect(PersonalFinanceEngine.debtAccounts[debtID].accrualRate).toEqual(newDebtInput.accrualRate);

            return PersonalFinanceEngine.deleteDebt(returnID);
          })
          .then(function(){
            done();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).toEqual(null);
            done();
          });
      })

      it("should edit the transfer definition for the initial value and accrualBuffer payment transfers if necessary", function(done) {
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).toBeDefined();
            return PersonalFinanceEngine.editDebt(debtID, newDebtInput);
          })
          .then( function (returnID) {
            initialTransferID = PersonalFinanceEngine.debtAccounts[debtID].initialTransferID;
            accrualTransferID = PersonalFinanceEngine.debtAccounts[debtID].accrualTransferID;
            expect(PersonalFinanceEngine.__test__.transferDefinitions[initialTransferID].toAccount).toEqual(PersonalFinanceEngine.debtAccounts[debtID]);
            expect(PersonalFinanceEngine.__test__.transferDefinitions[accrualTransferID].toAccount).toEqual(PersonalFinanceEngine.debtAccounts[debtID]);

            return PersonalFinanceEngine.deleteDebt(returnID);
          })
          .then(function(){
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

      it("should return an error object identifying numerous deficiencies as an issue when the input contains insufficient information", function(done) {
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).toBeDefined();
            return PersonalFinanceEngine.editDebt(debtID, badDebtInput);
          })
          .then( function (returnID) {
            expect(returnID).not.toBeDefined();
          })
          .catch( function (err) {
            if (err.name !== "InvalidInputError") {
              throw err;
            };
            expect(err).not.toEqual(null);
            expect(err.failedInputs.name).toEqual(true);
            expect(err.failedInputs.subType).toEqual(true);
            expect(err.failedInputs.startDate).toEqual(true);
            expect(err.failedInputs.fromAccount).toEqual(true);
            expect(err.failedInputs.initialValue).toEqual(true);
            expect(err.failedInputs.accrualRate).toEqual(true);
            expect(err.failedInputs.accrualPaymentFrequency).toEqual(true);
          })
          .then( function () {
            return PersonalFinanceEngine.deleteDebt(debtID);
          })
          .then(function(){
            done();
          })
      });
    });

    describe("deleteDebt()", function() {

      var debtInput;
      var debtID;
      var returnedDebtID;
      var err;

      beforeEach(function() {
        debtInput = {
          name: "Test",
          subType: "",
          startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
          fromAccount: "external",
          initialValue: 1000,  // Start balance of $1000
          accrualRate: 0.05,
          accrualPaymentFrequency: "Monthly"
        };
      });

      it("should have a deleteDebt method on the PersonalFinanceEngine scope.", function() {
        expect(PersonalFinanceEngine.deleteDebt).toEqual(jasmine.any(Function));
      });

      it("should properly delete the debt with the associated debtID and remove the debt from the debtAccounts map", function(done) {
        PersonalFinanceEngine.createDebt(debtInput)
          .then( function (returnID) {
            debtID = returnID;
            expect(debtID).toBeDefined();
            return PersonalFinanceEngine.deleteDebt(debtID);
          })
          .then( function (returnID) {
            expect(returnedDebtID).not.toBeDefined();
            expect(PersonalFinanceEngine.debtAccounts[debtID]).not.toBeDefined();
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

      describe("associatedTransfers", function() {

        var debtInput1;
        var debtInput2;
        var debtID1;
        var debtID2;
        var transferInput;
        var transferID;
        var err;

        beforeEach(function() {
          debtInput1 = {
            name: "Test1",
            subType: "",
            startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
            fromAccount: "external",
            initialValue: 1000,  // Start balance of $1000
            accrualRate: 0.05,
            accrualPaymentFrequency: "Monthly"
          };

          debtInput2 = {
            name: "Test2",
            subType: "",
            startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
            fromAccount: "external",
            initialValue: 1000,  // Start balance of $1000
            accrualRate: 0.05,
            accrualPaymentFrequency: "Monthly"
          };
        });

        it("should properly change the financialAccount references on any associated transfers to 'external'", function(done) {
          // Woo callcacks!
          PersonalFinanceEngine.createDebt(debtInput1)
            .then( function (returnID) {
              debtID1 = returnID;
              expect(debtID1).toBeDefined();
              return PersonalFinanceEngine.createDebt(debtInput2);
            })
            .then( function (returnID) {
              debtID2 = returnID;
              expect(debtID2).toBeDefined();
              transferInput = {
                fromAccount: PersonalFinanceEngine.debtAccounts[debtID1],
                toAccount: PersonalFinanceEngine.debtAccounts[debtID2],
                valueFunction: function(){return 2000;},
                date: new Date("1975-01-01"),
              };
              return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
            })
            .then( function (returnID) {
              transferID = returnID;
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].fromAccount.ID).toEqual(debtID1);
              return PersonalFinanceEngine.deleteDebt(debtID1);
            })
            .then( function(returnID) {
              expect(returnID).toEqual(null);
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].fromAccount).toEqual("external");

              return PersonalFinanceEngine.deleteDebt(debtID2);
            })
            .then(function(){
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

        it("should delete the transfer if the deleted account is the only non-external account reference it had.", function(done) {
          // Woo callcacks!
          PersonalFinanceEngine.createDebt(debtInput1)
            .then( function (returnID) {
              debtID1 = returnID;
              expect(debtID1).toBeDefined();
              return PersonalFinanceEngine.createDebt(debtInput2);
            })
            .then( function (returnID) {
              debtID2 = returnID;
              expect(debtID2).toBeDefined();
              transferInput = {
                fromAccount: PersonalFinanceEngine.debtAccounts[debtID1],
                toAccount: "external",
                valueFunction: function(){return 2000;},
                date: new Date("1975-01-01"),
              };
              return PersonalFinanceEngine.createOneTimeTransfer(transferInput);
            })
            .then( function (returnID) {
              transferID = returnID;
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID].fromAccount.ID).toEqual(debtID1);
              return PersonalFinanceEngine.deleteDebt(debtID1);
            })
            .then( function(returnID) {
              expect(returnID).toEqual(null);
              expect(PersonalFinanceEngine.__test__.transferDefinitions[transferID]).not.toBeDefined();

              return PersonalFinanceEngine.deleteDebt(debtID2);
            })
            .then(function(){
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

  describe("FinancialObject constructor", function() {

    var testObject;
    var testObject2;

    beforeEach(function() {
      testObject = new PersonalFinanceEngine.__test__.FinancialObject({
        ID: "3c9c7e16-e8ba-4076-b25d-08c36b24453d",
        name: "Test",
        startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.05
      });

      testObject2 = new PersonalFinanceEngine.__test__.FinancialObject({
        ID: "83a8e1e5-c6c4-4bfd-957d-f6d24f1d3fd1",
        name: "Test",
        startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.05
      });
    });

    it("should have a FinancialObject contstructor on the __test__scope", function () {
      expect(PersonalFinanceEngine.__test__.FinancialObject).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.FinancialObject).not.toBeDefined();
    });

    it("should be true that testObject is an instance of FinancialObject", function () {
      expect(testObject instanceof PersonalFinanceEngine.__test__.FinancialObject).toEqual(true);
    });

    it("should create the test FinancialObject 'testObject' with our init values", function () {
      expect(testObject.ID).toBeDefined();
      expect(testObject.name).toEqual("Test");
      expect(testObject.startDate).toEqual(new Date("1970-01-01"));
      expect(testObject.initialValue).toEqual(1000);
      expect(testObject.value).toEqual(0);
      expect(testObject.accrualRate).toEqual(0.05);
      expect(testObject.currentPeriodNetAccruals).toEqual(0);
      expect(testObject.currentYearNetAccruals).toEqual(0);
      expect(testObject.dataTable).toBeDefined();
      expect(testObject.associatedTransfers).toBeDefined();
    });

    it("should create unique UUIDs for different FinancialObjects", function () {
      expect(testObject.ID == testObject2.ID).toEqual(false);
    });

  });

  describe("Asset constructor", function() {

    var testAsset;

    beforeEach(function() {
      testAsset = new PersonalFinanceEngine.__test__.Asset({
        ID: "3c9c7e16-e8ba-4076-b25d-08c36b24453d",
        name: "Test",
        startDate: new Date("1970-01-01"), // Create a date of January 1st 1970.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0.05
      });
    });

    it("should have an Asset contstructor on the __test__scope", function () {
      expect(PersonalFinanceEngine.__test__.Asset).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.Asset).not.toBeDefined();
    });

    it("should be true that testAsset is an instance of Asset", function () {
      expect(testAsset instanceof PersonalFinanceEngine.__test__.Asset).toEqual(true);
    });

    it("should create the test Asset object 'testAsset' with our init values", function () {
      // Only test the changed properties in the sub prototype
      expect(testAsset.type).toEqual("Asset");
    });

  });

  describe("FinancialAccount constructor", function() {

    var testFinancialAccount;

    beforeEach(function() {
      testFinancialAccount = new PersonalFinanceEngine.__test__.FinancialAccount({
        ID: "3c9c7e16-e8ba-4076-b25d-08c36b24453d",
        name: "Test",
        startDate: new Date("1970-01-01"), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0
      });
    });

    it("should have an FinancialAccount contstructor on the __test__scope", function () {
      expect(PersonalFinanceEngine.__test__.FinancialAccount).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.FinancialAccount).not.toBeDefined();
    });

    it("should be true that testFinancialAccount is an instance of FinancialAccount", function () {
      expect(testFinancialAccount instanceof PersonalFinanceEngine.__test__.FinancialAccount).toEqual(true);
    });

    it("should create the test FinancialAccount object 'testFinancialAccount' with our init values", function () {
      expect(testFinancialAccount.yearsTransfers).toEqual(0);
    });

  });

  describe("ChequingAccount constructor", function() {

    var testChequingAccount;

    beforeEach(function() {
      PersonalFinanceEngine.modelParameters.timelineStartDate = new Date();

      testChequingAccount = new PersonalFinanceEngine.__test__.ChequingAccount({
        name: "Test",
        startDate: new Date(), //Create a current date object. We expect that the startDate in modelParameters will be used instead.
        fromAccount: "external",
        initialValue: 1000,  // Start balance of $1000
        accrualRate: 0 // With a negative accrual weight (depreciation) of 5% annually.
      });
    });

    it("should have an ChequingAccount contstructor on the __test__scope", function () {
      expect(PersonalFinanceEngine.__test__.ChequingAccount).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.ChequingAccount).not.toBeDefined();
    });

    it("should be true that testChequingAccount is an instance of ChequingAccount", function () {
      expect(testChequingAccount instanceof PersonalFinanceEngine.__test__.ChequingAccount).toEqual(true);
    });

    it("should create the test ChequingAccount object 'testChequingAccount' with our init values", function () {
      expect(testChequingAccount.type).toEqual("Chequing");
      expect(testChequingAccount.startDate).toEqual(PersonalFinanceEngine.modelParameters.timelineStartDate);
      expect(testChequingAccount.initialValue).toEqual(1000);
      expect(testChequingAccount.value).toEqual(1000);
      expect(testChequingAccount.yearsTransfers).toEqual(0);
    });

  });

  describe("InvestmentAccount constructor", function() {

    var testInvestmentAccount;

    beforeEach(function() {
      testInvestmentAccount = new PersonalFinanceEngine.__test__.InvestmentAccount({
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

    it("should have an InvestmentAccount contstructor on the __test__scope", function () {
      expect(PersonalFinanceEngine.__test__.InvestmentAccount).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.InvestmentAccount).not.toBeDefined();
    });

    it("should be true that testInvestmentAccount is an instance of InvestmentAccount", function () {
      expect(testInvestmentAccount instanceof PersonalFinanceEngine.__test__.InvestmentAccount).toEqual(true);
    });

    it("should create the test ChequingAccount object 'testChequingAccount' with our init values", function () {
      expect(testInvestmentAccount.type).toEqual("Investment");
      expect(testInvestmentAccount.subType).toEqual("");
      expect(testInvestmentAccount.accrualPaymentFrequency).toEqual("Monthly");
    });

  });

  describe("DebtAccount constructor", function() {

    var testDebtAccount;

    beforeEach(function() {
      testDebtAccount = new PersonalFinanceEngine.__test__.DebtAccount({
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

    it("should have an DebtAccount contstructor on the __test__scope", function () {
      expect(PersonalFinanceEngine.__test__.DebtAccount).toEqual(jasmine.any(Function));
      expect(PersonalFinanceEngine.DebtAccount).not.toBeDefined();
    });

    it("should be true that testDebtAccount is an instance of DebtAccount", function () {
      expect(testDebtAccount instanceof PersonalFinanceEngine.__test__.DebtAccount).toEqual(true);
    });

    it("should create the test DebtAccount object 'testDebtAccount' with our init values", function () {
      expect(testDebtAccount.type).toEqual("Debt");
      expect(testDebtAccount.subType).toEqual("");
      expect(testDebtAccount.accrualPaymentFrequency).toEqual("Monthly");
    });

  });
});
