var RuleEngine = require('../rules-engine');
/* Sample Rule to increment an attribute if its less than 10*/
var rule = {
    "condition": function(R) {
        R.when(this.someval < 5);
    },
    "consequence": function(R) {
        console.log(this.someval++, " : incrementing again till 5");
        R.restart();
    },
    "else": function (R) {
        console.log(this.someval, " : Its 10!");
        R.stop();
    }
};
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine(null,{ debug: true });
R.register(rule);
/* some val is 0 here, rules will recursively run till it becomes 10.
This just a mock to demo the restart feature. */
var fact = {
    "someval": 0
};
R.execute(fact, function(data) {
    console.log("Finished with value", data.someval);
});