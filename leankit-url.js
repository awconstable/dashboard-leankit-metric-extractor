
exports.boardId = (boardUrl) => {
    var regex = '^.*board\/(.*)';

    if(typeof boardUrl == 'undefined'){
        return "";
    }

    var regexOutput = boardUrl.match(regex);

    if(regexOutput === null || regexOutput.length == 0){
        return "";
    }

    return regexOutput[1];
}