var RuleEngine = require('../classes/rules-engine');
/* Sample Rule to block a transaction if its below 500 */
var rules = [{
    "condition": function(R) {
        R.whenTrue(this.transactionTotal < 500);
    },
    "action": function(R) {
        this.result = false;
        this.reason = "The transaction was blocked as it was less than 500";
        R.stop();
    }
}
,];

/* Fact with less than 500 as transaction, and this should be blocked */
var fact = {
    "name": "user4",
    "application": "MOB2",
    "transactionTotal": 600,
    "cardType": "Credit Card"
};

/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rules);
R.execute(fact, function(data) {
    if (data.result) {
        console.log("Valid transaction");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }
});