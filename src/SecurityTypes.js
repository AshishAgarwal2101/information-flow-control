"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityWrapper = exports.SecurityTypeLow = exports.SecurityTypeHigh = void 0;
var SecurityTypeHigh = /** @class */ (function () {
    function SecurityTypeHigh(value) {
        this.value = value;
        this.securityLevel = "H";
    }
    return SecurityTypeHigh;
}());
exports.SecurityTypeHigh = SecurityTypeHigh;
var SecurityTypeLow = /** @class */ (function () {
    function SecurityTypeLow(value) {
        this.value = value;
        this.securityLevel = "L";
    }
    return SecurityTypeLow;
}());
exports.SecurityTypeLow = SecurityTypeLow;
function instanceOfSecurityType(object) {
    return object instanceof SecurityTypeHigh
        || object instanceof SecurityTypeLow;
}
var SecurityWrapper = function (value, securityLevel) {
    var res;
    if (securityLevel === "H") {
        res = new SecurityTypeHigh(value);
    }
    else {
        res = new SecurityTypeLow(value);
    }
    return new Proxy(res, proxyHandlerSt);
};
exports.SecurityWrapper = SecurityWrapper;
var proxyHandlerSt = {
    get: function (target, prop) {
        //when actual values of SecurityType are asked
        if (prop === "value") {
            return Reflect.get(target, prop);
        }
        var prim = Reflect.get(target, 'value');
        var targetSecurityType = Reflect.get(target, 'securityLevel');
        var value = prim[prop];
        //Not a function, just a normal value asked
        if (typeof value !== 'function') {
            return (0, exports.SecurityWrapper)(value, targetSecurityType);
        }
        //when function is asked, return a wrapped function
        var toBeCalledFunc = value.bind(prim);
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var maxSecurityLevel = targetSecurityType;
            var updatedArgs = args.map(function (arg) {
                if (instanceOfSecurityType(arg)) {
                    var argValue = Reflect.get(arg, "value", arg);
                    var argSecurityLevel = Reflect.get(arg, "securityLevel", arg);
                    if (argSecurityLevel === "H") {
                        maxSecurityLevel = "H";
                    }
                    return argValue;
                }
                return arg;
            });
            return (0, exports.SecurityWrapper)(toBeCalledFunc.apply(void 0, updatedArgs), maxSecurityLevel);
        };
    }
};
