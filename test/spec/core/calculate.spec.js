describe("Calculate functions", function() {

  it("should have a calculate method on the PersonalFinanceEngine scope.", function() {
    expect(PersonalFinanceEngine.calculate).toEqual(jasmine.any(Function));
  });

  it("should have a private getTaxModel method on the __test__ scope", function() {
    expect(PersonalFinanceEngine.__test__.getTaxModel).toBeDefined();
    expect(PersonalFinanceEngine.getTaxModel).not.toBeDefined();
  });

  it("should have a private calculateTaxes method on the __test__ scope", function() {
    expect(PersonalFinanceEngine.__test__.calculateTaxes).toBeDefined();
    expect(PersonalFinanceEngine.calculateTaxes).not.toBeDefined();
  });
});
