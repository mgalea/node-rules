var user5 = {
    "userIP": "27.3.4.5",
    "name": "user5",
    "eventRiskFactor": 8,
    "userCredibility": 8,
    "appCode": "WEB1",
    "userLoggedIn": true,
    "transactionTotal": 500,
    "cardType": "Credit Card",
    "cardIssuer": "VISA",
};

function engine (outcome) {
    if (outcome) {
        console.log("There is a match");
            //_consequence.call(session, API, session);
        }

}

var blacklist = ["user4"];
user5.when(this && blacklist.indexOf(this.name) > -1);