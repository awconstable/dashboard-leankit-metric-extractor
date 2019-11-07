const dateFormat = require('dateformat');

exports.reportingDate = (month) => {
    var rawReportingDate = new Date();
    rawReportingDate.setTime(Date.parse(month));
    rawReportingDate.setDate(1);

    var reportingDate = new Date(rawReportingDate.setMonth(rawReportingDate.getMonth()+1));

    reportingDate.setDate(0);

    return dateFormat(reportingDate, "yyyy-mm-dd");
}