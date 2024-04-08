"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SecurityTypes_1 = require("./SecurityTypes");
function leak1(secret) {
    var x = (0, SecurityTypes_1.SecurityWrapper)(true, "L");
    if (secret.value) {
        x = (0, SecurityTypes_1.SecurityWrapper)(false, "L");
    }
    return x;
}
function leak2(secret) {
    var x = true;
    if (secret.value) {
        //@jjIgnoreInformationFlow
        x = (0, SecurityTypes_1.SecurityWrapper)(true, "H");
    }
    var y = false;
    if (x !== true) {
        y = true;
    }
    return y;
}
function leak3(secret) {
    if (secret.value > 5) {
        throw new Error("The value of secret is " + secret.value + ", which does not satisfy requirements.");
    }
    return "Secret value is less than 5";
}
function leak4(secret) {
    console.log("Secret value is " + secret.value);
}
function sendViaApi(secret) {
    try {
        return leak3(secret);
    }
    catch (e) {
        return e.message;
    }
}
console.log("--------------------------------INFORMATION LEAK PROBLEM------------------------------------------");
console.log(leak1((0, SecurityTypes_1.SecurityWrapper)(false, "H")));
console.log(leak2((0, SecurityTypes_1.SecurityWrapper)(true, "H")));
console.log(sendViaApi((0, SecurityTypes_1.SecurityWrapper)(4, "H")));
console.log(sendViaApi((0, SecurityTypes_1.SecurityWrapper)(14, "H")));
leak4((0, SecurityTypes_1.SecurityWrapper)(56, "H"));
