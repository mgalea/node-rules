
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
    init() {
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
        for (var rule of this.rules) {
            if (typeof (rule.priority) === "undefined") {
                rule.priority = 0;
            }
        }

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
                        var _action = _rules[x].action;
                        _action.ruleRef = _rules[x].id || _rules[x].name || 'index_' + x;
                        thisHolder.nextTick(function () {
                            matchPath.push(_action.ruleRef);
                            _action.call(session, API, session);
                        });
                    } else {
                        thisHolder.nextTick(function () {
                            API.next();
                        });
                    }
                },
                "whenFalse": function (outcome) {
                    if (!outcome) {
                        var _action = _rules[x].action;
                        _action.ruleRef = _rules[x].id || _rules[x].name || 'index_' + x;
                        thisHolder.nextTick(function () {
                            matchPath.push(_action.ruleRef);
                            _action.call(session, API, session);
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
                },
                "skip": function (n) {
                    if (!ignoreFactChanges && !isEqual(lastSession, session)) {
                        lastSession = clonedeep(session);
                        thisHolder.nextTick(function () {
                            API.restart();
                        });
                    } else {
                        thisHolder.nextTick(function () {
                            return FnRuleLoop(x + n);
                        });
                    }
                },
                "skipTo": function (id) {
                    this.rules.filter(function (a) {
                        if (typeof (a.id) === "undefined") {
                            console.log('undefined rule');
                        }
                        if (a.on === true) {
                            console.log(a);
                        }
                    });
                    if (!ignoreFactChanges && !isEqual(lastSession, session)) {
                        lastSession = clonedeep(session);
                        thisHolder.nextTick(function () {
                            API.restart();
                        });
                    } else {
                        thisHolder.nextTick(function () {
                            return FnRuleLoop(x + n);
                        });
                    }
                }
            };
            _rules = thisHolder.activeRules;
            if (x < _rules.length && rules[x].priority >= 0 && complete === false) {
                console.log('executing rule: ' + x);
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
    toJSON() {
        return this.rules;
    }
    export() {
        var json = JSON.stringify(this.rules, function (key, value) {
            if (typeof value === "function") {
                return "/Function(" + value.toString() + ")/";
            }
            return value;
        }, 0
        );
        return json;
    }
    import(importString) {
        var obj2 = JSON.parse(importString, function (key, value) {
            if (typeof value === "string" &&
                value.startsWith("/Function(") &&
                value.endsWith(")/")) {
                value = value.substring(10, value.length - 2);
                return (0, eval)("(" + value + ")");
            }
            return value;
        });
        return obj2;
    }

};

var rules = [
    {
        priority: 2,
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
            R.whenFalse(this.application == "MT");
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
var R2 = new RuleEngine();

R.register(rules);
/* Fact with less than 500 as transaction, and this should be blocked */
var fact = {
    "name": "user4",
    "application": "MA",
    "transactionTotal": 600,
    "cardType": "Credit Card"
};

console.dir(R.toJSON());
R2.register(R.import(R.export()))

R2.execute(fact, function (data) {
    if (data.result) {
        console.log("Valid transaction");
    } else {
        console.log("Blocked Reason:" + data.reason);
    }
});

module.exports = RuleEngine;