var RuleEngine = require('../rules-engine');
/* Sample Rule to increment an attribute if its less than 10*/
var rule = {
    "condition": function(R) {
        var Today=  Date.now();
        R.when(Date.parse(this.someDate) < Today);
    },
    "action": function(R) {
        var startDate = new Date(this.someDate);
        console.log(this.someDate, " : incrementing a day till Today");
        // seconds * minutes * hours * milliseconds = 1 day 
        var day = 60 * 60 * 24 * 1000;
        var endDate = new Date(startDate.getTime() + day);
        this.someDate=endDate.toISOString();
        R.restart();
    },
    "else" : function (R) {
        var startDate = new Date(this.someDate);
        var day = 60 * 60 * 24 * 1000;
        var endDate = new Date(startDate.getTime() - day);
        this.someDate = endDate.toISOString();
        R.stop();
    }
};
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine(rule,{ignoreFactChanges:true, debug: false });
/* some val is 0 here, rules will recursively run till it becomes 10.
This just a mock to demo the restart feature. */
var fact = {
    "someDate": '2020-10-13'
};
console.log(Date.parse(fact.someDate))

R.execute(fact, function(data) {
    console.log("Finished with value", data.someDate);
});