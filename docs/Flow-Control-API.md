# Flow Control API 
This is an object injected into the condition and consequence functions defined by the user to make it easy for the user to define the Rule Engine flow.

If you look at the below rule example.

    {
		"name": "transaction minimum",
		"priority": 3,
		"on" : true,
		"condition": function(R) {
			R.whenTrue(this.transactionTotal < 500);
		},
		"action": function(R) {
			this.result = false;
			R.stop();
		},
		"else": function(R) {
		this.result = false;
		R.stop();
		}
    }

The `R` object injected in both condition and consequence refers to the API we are talking about.

Below are the functions available via the Flow Control API.

***Note*** The rules counter start from 0.

## Branching
The original engine does not support branching. In a forward chaining engine, branching makes little sense, but it is useful under certain circumstances. 

When a `fact` changes the engine automatically restarts causing the last test cycle to be repeated twice. Here is a good example. Best to enable debug here to see whats happening:

``` js
var RuleEngine = require('../rules-engine');
/* Sample Rule to increment an attribute if its less than 10*/
var rule = {
    "condition": function(R) {
        R.when(this.someval < 5);
    },
    "action": function(R) {
        console.log(this.someval++, " : incrementing again till 5");
        R.restart();
    }
};
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine(null,{ debug: false });
R.register(rule);
/* some val is 0 here, rules will recursively run till it becomes 10.
This just a mock to demo the restart feature. */
var fact = {
    "someval": 0
};
R.execute(fact, function(data) {
    console.log("Finished with value", data.someval);
});

```
generates the following output:
```
executing rule: 0
0  : incrementing again till 5
executing rule: 0
1  : incrementing again till 5
executing rule: 0
2  : incrementing again till 5
executing rule: 0
3  : incrementing again till 5
executing rule: 0
4  : incrementing again till 5
executing rule: 0
executing rule: 0
Finished with value 5
```
The loop does an extra iteration at the end. Now if we introduce the else statement.

``` js
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
```
The output is as follows:

```
0  : incrementing again till 5
executing rule: 0
1  : incrementing again till 5
executing rule: 0
2  : incrementing again till 5
executing rule: 0
3  : incrementing again till 5
executing rule: 0
4  : incrementing again till 5
executing rule: 0
5  : Its 10!
Finished with value 5
```

The extra test cycle at the end is avoided.

#### R.whenTrue
This function is used to pass the condition expression that we want to evaluate. In the above expression we pass the expression to check whether the transactionTotal attribute of the fact in context is below 500 or not. If the expression passed to `R.when` evaluates to **true**, then the condition will execute. Else the rule engine will move to next rule or may terminate if there are no rules left to apply.

#### R.whenFalse
This function is used to pass the condition expression that we want to evaluate. If the expression passed to `R.whenFalse` evaluates to **false**, then the condition will execute. Else the rule engine will move to next rule or may terminate if there are no rules left to apply.

#### R.next
This function is used inside action functions. This is used to instruct the rule engine to start applying the next rule on the fact if any.

#### R.Skip(n)
This function is used the same as the R.next function above but will skip n number of rules in the list. *R.Skip(0)* is the same as *R.next*. 

#### R.goto({id: rule_id})
This function is used to branch to a rule/s whose id is set to rule_id.  If the destination rule has a priority set to a negative number, then **R.next** will return to the triggering rule, else it will continue until the end of the test cycle.  **R.restart** and **R.stop** behave normally. If a set of rules have the same rule_id then then the R.goto will iterate through all those rules unless any of those rules cause an exit. 

#### R.nextPriority
This function is used inside action functions. This is used to instruct the rule engine to start applying the next (ie *.this+1*) level of rule priority on the fact if any. If the priority attribute is not define then the rule engine defaults to **R.next** above. This is useful when you want to skip a set of rules **with the same priority**.

#### R.stop
This function is used inside consequence functions to instruct the Rule Engine to stop processing the fact. If this function is called, even if rules are left to be applied, the rule engine will not apply rest of rules on the fact. It is used mostly when we arrive a conclusion on a particular fact and there is no need of any further process on it to generate a result. 

As you can see above example, when the transaction is less than 500, we no longer need to process the rule. So stores false in result attribute and calls the stop immediately inside consequence.

#### R.restart
This function is used inside consequence functions to instruct the rule engine to begin applying the Rules on the fact from first. This function is also internally used by the Rule engine when the fact object is modified by a consequence function and it needs to go through all the rules once gain.




