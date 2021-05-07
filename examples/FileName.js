var RuleEngine = require('../classes/rules-engine');

var fact = {
    "operator": "4021",
    "year": 2021,
    "month": 04,
    "day": 15,
    "hour": 00,
    "minute": 00,
    "second": 00,
    "report": "B2CSMRY",
    "version": 01
};


/* Sample Rule to block a transaction if its below 500 */
var rules = [{
    "condition": function (R) {
        var allowedRegexp = new RegExp('[0-9]{4}','i');
        R.whenFalse(this.operator.match(allowedRegexp));
    },
    "action": function (R) {
        this.result = false;
        this.reason = "Wrong operator details";
        R.stop();
    }
},
{
    "condition": function (R) {
        var d = new Date();
        R.when(this.year > d.getFullYear());
    },
    "action": function (R) {
        this.result = false;
        this.reason = "Wrong report year";
        R.stop();
    }
},
{
    "condition": function (R) {
        R.when(this.month < 1 || this.month > 12);
    },
    "action": function (R) {
        this.result = false;
        this.reason = "Wrong report month";
        R.stop();
    }
},
{
    "condition": function (R) {
        R.when(this.day < 1 || this.day > 31);
    },
    "action": function (R) {
        this.result = false;
        this.reason = "Wrong report day";
        R.stop();
    }
},
{
    "condition": function (R) {
        R.whenFalse(this.hour == this.minute == this.second == 00);
    },
    "action": function (R) {
        this.result = false;
        this.reason = "Wrong time";
        R.stop();
    }
},
{
    "condition": function (R) {
        var allowedRegexp = new RegExp('B2C[A-Z]{2,20}', 'i');
        R.whenFalse(this.report.match(allowedRegexp));
    },
    "action": function (R) {
        this.result = false;
        this.reason = "Wrong name";
        R.stop();
    }
}

];


/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rules);
/* Fact with less than 500 as transaction, and this should be blocked */

R.execute(fact, function (data) {
    if (data.result) {
        console.log("Valid filename");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }
});