#!/usr/bin/env node
require('fetch-with-proxy');
const dateFormat = require('dateformat');
const leankitUrl = require('./leankit-url');

const argv = require('yargs')
.env('DASHBOARD')
.option('ts_url', { 
    describe:'Specify the Team Service URL'
})
.option('td_url', { 
    describe:'Specify the Team Dashboard URL'
})
.option('lk_account', { 
    describe:'Specify the LeanKit account name (https://<account id>.leankit.com)'
})
.option('lk_email', {
    describe:'The email address used to log in to LeanKit'
})
.option('lk_password', {
    alias: 'lk_pass', 
    describe:'The password used to log in to LeanKit'
})
.option('month', {
    alias: 'm', 
    describe:'The month as a date to lead time calculation during. Format: YYYY-MM'
})
.demandOption(['ts_url', 'td_url', 'lk_account', 'lk_email', 'lk_password', 'month'], 'Please provide all arguments to work with this tool')
.help('help')
.argv

const LeanKitClient = require( "leankit-client" );

const auth = {
    account: argv.lk_account,
    email: argv.lk_email,
    password: argv.lk_password
};
const client = LeanKitClient( auth );

const main = async () => {

    getTeams(argv.ts_url + "/v2/hierarchy/all", processTeams);
}

function processTeams(teams){
    console.log(teams);

    for(i = 0; i < teams.length; i++){
        if(teams[i].workTrackingTools != null){
            var tools = teams[i].workTrackingTools;
            console.log(tools);
            for(j = 0; j < tools.length; j++){
                if(tools[j].type.key === "LEANKIT"){
                    getBoardMetrics(tools[j].url, teams[i].slug);
                }
            }
        }
    }
}

function getBoardMetrics(boardUrl, teamId){

    var boardId = leankitUrl.boardId(boardUrl);

    if(boardId === ""){
        return;
    }

    const query = {
        board: boardId,
        limit: 1000
    };

    client.card.list( query ).then(processResponse.bind(null,teamId)).catch( err => {
        console.error( "Error getting cards:", err );
    } );
}

function getTeams(url, cb) {
    fetch(url)
    .then(res => res.json())
    .then(json => cb(json));
}

function processResponse(teamId, response){
    var metrics = processCards(response.data.cards);

    console.log("Team ID: " + teamId);
    console.log("Card Count: " + metrics.cardCount);
    console.log("Average Lead Time (Days): " + metrics.averageLeadTime);
    console.log("Average Cycle Time (Days): " + metrics.averageCycleTime);

    submitMetricToDashboard(teamId, "lead_time", metrics.averageLeadTime);
    submitMetricToDashboard(teamId, "cycletime", metrics.averageCycleTime);
}

function getReportingDate(){
    var rawReportingDate = new Date();
    rawReportingDate.setTime(Date.parse(argv.month));
    rawReportingDate.setDate(1);

    var reportingDate = new Date(rawReportingDate.setMonth(rawReportingDate.getMonth()+1));

    reportingDate.setDate(0);

    return dateFormat(reportingDate, "yyyy-mm-dd");
}

function submitMetricToDashboard(teamId, metricId, value){

    var reportingDate = getReportingDate();

    fetch(argv.td_url + "/api/metrics/" + teamId + "/" + reportingDate, { 
        method: 'POST', 
        body: '[{"teamMetricType": "' + metricId + '", "value": ' + value + '}]',
        headers: { 'Content-Type': 'application/json' }})
    .then(res => res.json())
    .then(json => console.log(json));
}

function processCards(cards) {

    var totalLeadTime = 0;
    var totalCycleTime = 0;
    var averageLeadTime = 0;
    var cardCount = 0;

    if(cards.length == 0){
        return { cardCount: cardCount, averageLeadTime: averageLeadTime, averageCycleTime: averageCycleTime };
    }

    for(i = 0; i < cards.length; i++){
        var stats = processCard(cards[i]);

        if(typeof stats !== 'undefined'){
            totalLeadTime += stats.leadtime;
            totalCycleTime += stats.cycletime;
            cardCount++;
        }
    }
    averageLeadTime = Math.round((totalLeadTime / cardCount) * 10) / 10;
    averageCycleTime = Math.round((totalCycleTime / cardCount) * 10) / 10;

    return { cardCount: cardCount, averageLeadTime: averageLeadTime, averageCycleTime: averageCycleTime };
}

function inScopeCheck(cardFinishTime){
    var cardFinish = new Date();
    cardFinish.setTime(cardFinishTime);

    var leadTimeMonth = new Date();
    leadTimeMonth.setTime(Date.parse(argv.month));

    if(leadTimeMonth.getMonth() === cardFinish.getMonth() && leadTimeMonth.getFullYear() === cardFinish.getFullYear()){
        return true;
    }
    return false;
}

function processCard(card){
    if(typeof card !== 'undefined' && card.actualFinish){
        const created = Date.parse(card.createdOn);
        const start = Date.parse(card.actualStart);
        const finish = Date.parse(card.actualFinish);
        const leadTimeMillis = finish - created;
        const leadTimeSeconds = leadTimeMillis / 1000;
        const leadTimeDays = leadTimeSeconds / 60 / 60 / 24;
        const cycleTimeMillis = finish - start;
        const cycleTimeSeconds = cycleTimeMillis / 1000;
        const cycleTimeDays = cycleTimeSeconds / 60 / 60 / 24;

        //Filter out cards less a lead time of less than 30 mins (It looks like LeanKit does this in it's cycle time chart)
        if(inScopeCheck(finish) && leadTimeSeconds > (60 * 30)){
            return { leadtime: leadTimeDays, cycletime: cycleTimeDays };
        }
    };
}

main();
