var ReportingDate = require('./../reporting-date');

var assert = require('assert');

describe('ReportingDate', function(){
  describe('#reportingDate("2019-11")', function(){
    it('should return the last day of the month for reporting purposes', function(){
      assert.equal(ReportingDate.reportingDate("2019-11"), "2019-11-30");
    });
  });
})