`Facts` are those input json values on which the rule engine applies its rule to obtain results. A fact can have multiple attributes as you decide.

A `Fact` is made of one or more attributes. Each attribute must be a key-value pair.

A sample `Fact` may look like
``` js
    {
	  "userIP": "27.3.4.5",
	  "name":"user4",
	  "application":"MOB2",
	  "userLoggedIn":true,
	  "transactionTotal":400,
	  "cardType":"Credit Card",
    }
```
The above `Fact` goes through the rule engine when its executed. The conditions inside each rule will inspect the attributes again user defined conditions and consequences will be applied if they match for the `fact`. 

`Facts` can be changed dynamically, during the execution of a rule set. You can change the value of an attribute or add a new attributes. If the rules engine detects a change in a Fact is restarts and executes the new rule-set with the changes. To stop this from happening set `ignoreFactChanges` option when registering a new `RulesEngine`.