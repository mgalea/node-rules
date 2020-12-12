
var isEqual = require('lodash.isequal');
var clonedeep = require('lodash.clonedeep');

class RuleEngine {
    constructor(rules, options) {
        this.init();
        if (typeof (rules) != "undefined") {
            this.register(rules);
        }
        if (options) {
            this.ignoreFactChanges = options.ignoreFactChanges;
        }
        return this;
    }
    init(rules) {
        this.rules = [];
        this.activeRules = [];
    }
    register(rules) {
        if (Array.isArray(rules)) {
            this.rules = this.rules.concat(rules);
        } else if (rules !== null && typeof (rules) == "object") {
            this.rules.push(rules);
        }
        this.sync();
    }
    sync() {
        this.activeRules = this.rules.filter(function (a) {
            if (typeof (a.on) === "undefined") {
                a.on = true;
            }
            if (a.on === true) {
                return a;
            }
        });
        this.activeRules.sort(function (a, b) {
            if (a.priority && b.priority) {
                return b.priority - a.priority;
            } else {
                return 0;
            }
        });
    }
    execute(fact, callback) {
        //these new attributes have to be in both last session and current session to support
        // the compare function
        var thisHolder = this;
        var complete = false;
        fact.result = true;
        var session = clonedeep(fact);
        var lastSession = clonedeep(fact);
        var _rules = this.activeRules;
        var matchPath = [];
        var ignoreFactChanges = this.ignoreFactChanges;
        (function FnRuleLoop(x) {
            var API = {
                "rule": function () { return _rules[x]; },
                "whenTrue": function (outcome) {
                    if (outcome) {
                        var _consequence = _rules[x].action;
                        _consequence.ruleRef = _rules[x].id || _rules[x].name || 'index_' + x;
                        thisHolder.nextTick(function () {
                            matchPath.push(_consequence.ruleRef);
                            _consequence.call(session, API, session);
                        });
                    } else {
                        thisHolder.nextTick(function () {
                            API.next();
                        });
                    }
                },
                "whenFalse": function (outcome) {
                    if (!outcome) {
                        var _consequence = _rules[x].action;
                        _consequence.ruleRef = _rules[x].id || _rules[x].name || 'index_' + x;
                        thisHolder.nextTick(function () {
                            matchPath.push(_consequence.ruleRef);
                            _consequence.call(session, API, session);
                        });
                    } else {
                        thisHolder.nextTick(function () {
                            API.next();
                        });
                    }
                },
                "restart": function () {
                    return FnRuleLoop(0);
                },
                "stop": function () {
                    complete = true;
                    return FnRuleLoop(0);
                },
                "next": function () {
                    if (!ignoreFactChanges && !isEqual(lastSession, session)) {
                        lastSession = clonedeep(session);
                        thisHolder.nextTick(function () {
                            API.restart();
                        });
                    } else {
                        thisHolder.nextTick(function () {
                            return FnRuleLoop(x + 1);
                        });
                    }
                }
            };
            _rules = thisHolder.activeRules;
            if (x < _rules.length && complete === false) {
                console.log('executing rule: '+x);
                var _rule = _rules[x].condition;
                _rule.call(session, API, session);
            } else {
                thisHolder.nextTick(function () {
                    session.matchPath = matchPath;
                    return callback(session);
                });
            }
        })(0);
    }
    nextTick(callbackFn) {
        if (process && process.nextTick) {
            process.nextTick(callbackFn);
        } else {
            setTimeout(callbackFn, 0);
        }
    }
    findRules(query) {
        if (typeof (query) === "undefined") {
            return this.rules;
        } else {
            // Clean the properties set to undefined in the search query if any to prevent miss match issues.
            Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
            // Return rules in the registered rules array which match partially to the query.
            return this.rules.filter(function (rule) {
                return Object.keys(query).some(function (key) {
                    return query[key] === rule[key];
                });
            });
        }
    }
    turn(state, filter) {
        var state = (state === "on" || state === "ON") ? true : false;
        var rules = this.findRules(filter);
        for (var i = 0, j = rules.length; i < j; i++) {
            rules[i].on = state;
        }
        this.sync();
    }
    prioritize(priority, filter) {
        priority = parseInt(priority, 10);
        var rules = this.findRules(filter);
        for (var i = 0, j = rules.length; i < j; i++) {
            rules[i].priority = priority;
        }
        this.sync();
    }
};

var rules = [
    {
        "condition": function (R) {
            R.whenTrue(this.transactionTotal < 500);
        },
        "action": function (R) {
            this.result = false;
            this.reason = "The transaction was blocked as it was less than 500";
            R.stop();
        },
    },
    {
        "condition": function (R) {
            R.whenFalse(this.application=="MT");
        },
        "action": function (R) {
            this.result = false;
            this.reason = "Application must be MT";
            R.stop();
        }
    }

];

/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();

R.register(rules);
/* Fact with less than 500 as transaction, and this should be blocked */
var fact = {
    "name": "user4",
    "application": "MA",
    "transactionTotal": 600,
    "cardType": "Credit Card"
};

R.execute(fact, function (data) {
    if (data.result) {
        console.log("Valid transaction");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }
});

module.exports = RuleEngine;