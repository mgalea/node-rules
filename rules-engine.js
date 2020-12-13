

var isEqual = require('lodash.isequal');
var clonedeep = require('lodash.clonedeep');

class RuleEngine {
    constructor(rules, options) {
        this.ruleIndex = 0;
        this.init();
        if (options) {
            this.debug = options.debug || false;
            this.ignoreFactChanges = options.ignoreFactChanges || false;
        }
        if (typeof (rules) != "undefined") {
            this.register(rules);
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

        for (var rule of this.activeRules) {
            rule.ruleIndex = this.ruleIndex++;
        }
        if (this.debug) console.log(this.activeRules)
    }
    execute(fact, callback) {
        var thisHolder = this;
        var complete = false;
        fact.result = true;
        var session = clonedeep(fact);
        var lastSession = clonedeep(fact);
        var _rules = this.activeRules;
        var matchPath = [];
        var ignoreFactChanges = this.ignoreFactChanges;
        var debug = this.debug;
        (function FnRuleLoop(x, ignorePriority) {
            var API = {
                "rule": function () { return _rules[x]; },
                "whenTrue": function (outcome) {
                    if (outcome) {
                        var _action = _rules[x].action || _rules[x].consequence; //`consequence` is for backward compatibility to node-rules module 
                        _action.ruleRef = _rules[x].id || _rules[x].name || 'index_' + x;
                        thisHolder.nextTick(function () {
                            matchPath.push(_action.ruleRef);
                            _action.call(session, API, session);
                        });
                    } else {
                        if (typeof (_rules[x].else) != "undefined") {
                            var _else = _rules[x].else;
                            _else.ruleRef = _rules[x].id || _rules[x].name || 'index_' + x;
                            matchPath.push(_else.ruleRef);
                            _else.call(session, API, session);
                        } else {
                            thisHolder.nextTick(function () {
                                API.next();
                            });
                        }
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
                "when": function (outcome) {   //`when` is for backward compatibility to node-rules module 
                    return this.whenTrue(outcome)
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
                "goto": function (filter) {
                    var gotoRules = thisHolder.findRules(filter);
                    if (gotoRules) {
                        for (var gotoRule of gotoRules) {
                            console.log("Got into Goto Found Rule ", gotoRule)
                            if (!ignoreFactChanges && !isEqual(lastSession, session)) {
                                lastSession = clonedeep(session);
                            }
                            if (gotoRule.ruleIndex) {           //Make sure that ruleIndex is set as it may be an "OFF" rule.
                                thisHolder.nextTick(function () {
                                    FnRuleLoop(gotoRule.ruleIndex, true);
                                });
                            }
                        }
                    }
                    thisHolder.nextTick(function () {
                        return FnRuleLoop(x + 1);
                    });
                }

            };
            _rules = thisHolder.activeRules;
            if ((x < _rules.length && _rules[x].priority >= 0 && complete === false) || ignorePriority === true) {
                if (debug) console.log('executing rule: ' + x);
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
        if (process && process.nextTick) {  //If the rule-engine is running under node then use the process.nextTick() functionality...
            process.nextTick(callbackFn);   //execution is faster with nextTick...
        } else {
            setTimeout(callbackFn, 0);   //...otherwise just use plain old javascript.
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

module.exports = RuleEngine;
