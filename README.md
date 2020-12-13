Rules-Engine
=====

Rules-Engine is a light-weight, non-linear Rule Engine written in JavaScript. It is uses the great work of Mithun Satheesh's forward chaining Rule Engine, [node-rules](https://mithunsatheesh.github.io/node-rules). My version simply adds branching functionality and re-introduced importing and exporting. All credits for this work goes to Mithun Satheesh.

Due to the many changes made to the original work, I have re-written many parts of the documentation. This version is backward compatible to [node-rules](https://mithunsatheesh.github.io/node-rules).

#### Overview

Rules-Engine takes rules written in JSON friendly format as input. Once the rule engine is running with rules registered on it, you can feed it facts and the rules will be applied one by one to generate an outcome.

###### 1. Defining a Rule

A rule will consist of a condition and its corresponding consequence. You can find the explanation for various mandatory and optional parameters of a rule in [this wiki](docs/Rules).

``` js
{   
    "priority": 1,
    "condition" : function(R) {
        R.whenTrue(this.transactionTotal < 500);
    },
    "action" : function(R) {
        this.result = false;
        R.stop();
    },
    "else" :  function(R) {  // The else di rective is optional
        R.next();
    }
}
```

Here priority is an optional parameter which will be used to specify priority of a rule over other rules when there are multiple rules running. In the above rule `R.whenTrue` evaluates the truthfulness of the condition expression and `R.stop` used to stop further processing of the fact as we have arrived at a result. The original engine uses `R.when` which has been retained for backward compatibility and is equivalent to `R.whenTrue`.

In the original engine the `action` was defined by the `consequence` key whihc has been retained for backward compatibility. The reason for change is that now it is possible to trigger another process if `condition` is not met by using the `else` directive.

The functions `R.stop`, `R.whenTrue`, `R.whenFalse`,`R.next`, `R.skip`,`R.goto`,`R.restart` are part of the Flow Control API which allows user to control the Engine Flow. Read more about  [Flow Controls](docs/Flow-Control-API.md) in [wiki](/docs).


###### 2. Defining a Fact
Facts are those input json values on which the rule engine applies its rule to obtain results. A fact can have multiple attributes as you decide.

A sample Fact may look like

	{
	  "name":"user4",
	  "application":"MOB2",
	  "transactionTotal":400,
	  "cardType":"Credit Card",
    }

###### 3. Using the Rule Engine

The example below shows how to use the rule engine to apply a sample rule on a specific fact. Rules can be fed into the rule engine as Array of rules or as an individual rule object.

``` js
var RuleEngine = require("path/to/rules-engine");

/* Creating Rule Engine instance */
var R = new RuleEngine();

/* Add a rule */
var rule = {
    "condition": function(R) {
        console.log(this);
        R.whenTrue(this.transactionTotal < 500);
    },
    "action": function(R) {
        this.result = false;
        this.reason = "The transaction was blocked as it was less than 500";
        R.stop();
    }
};

/* Register Rule */
R.register(rule);

/* Add a Fact with less than 500 as transaction, and this should be blocked */
var fact = {
    "name": "user4",
    "application": "MOB2",
    "transactionTotal": 400,
    "cardType": "Credit Card"
};

/* Check if the engine blocks it! */
R.execute(fact, function (data) {
    if (data.result) {
        console.log("Valid transaction");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }
});
```

###### 4. Controlling Rules running on the Rule Engine
If you are looking for ways to specify the order in which the rules get applied on a fact, it can be done via using the `priority` parameter. Read more about it in the [Rule wiki](docs/Rules). If you need to know about how to change priority of rules or remove add new rules to a Running Rule Engine, you may read more about it in [Dynamic Control Wiki](docs/Dynamic-Control).

###### 5. Exporting Rules to an external storage
To read more about storing rules running on the engine to an external DB.


#### Wiki
To read more about the Rule engine functions, please read [the wiki here](/docs)!. To find more examples of implementation please look in the [examples](/examples) folder.

#### External References
* https://ieeexplore.ieee.org/document/7968566

#### Credits
The JSON friendly rule formats used in version 2.x.x of this module were initially based on the node module [jools](https://github.com/tdegrunt/jools).
