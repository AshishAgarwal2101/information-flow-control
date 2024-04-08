"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SecurityTypes_1 = require("./SecurityTypes");
var StringHigh1 = (0, SecurityTypes_1.SecurityWrapper)("Private String 1", "H");
var StringLow2 = (0, SecurityTypes_1.SecurityWrapper)("Public String 2", "L");
console.log(StringHigh1);
console.log(StringLow2);
var ch = StringHigh1.charAt(2); //directly using String method charAt() without unwrapping, security level of ch is "H"
console.log("Extracted char = ", ch);
var subSt = StringLow2.substring(0, 6);
console.log("Extracted substring = ", subSt);
var concatStr = StringHigh1.concat(" ").concat(StringLow2); //concatStr has security level "H"
console.log("Concatenated String = ", concatStr);
console.log(concatStr instanceof SecurityTypes_1.SecurityTypeHigh); //true
