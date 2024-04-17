import { SecurityWrapper, SecurityTypeHigh, SecurityTypeLow } from "./SecurityTypes";

const stringHigh1: SecurityTypeHigh = SecurityWrapper("Private String 1", 
    "H");
const stringLow2: SecurityTypeLow = SecurityWrapper("Public String 2", "L");

console.log(stringHigh1);
console.log(stringLow2);

const ch: SecurityTypeHigh = stringHigh1.charAt(2); //directly using String method charAt() without unwrapping, security level of ch is "H"
console.log("Extracted char = ", ch.value);

const subSt: SecurityTypeLow = stringLow2.substring(0, 6);
console.log("Extracted substring = ", subSt.value);

const concatStr: SecurityTypeHigh = stringHigh1.concat(" ")
    .concat(stringLow2); //concatStr has security level "H"
console.log("Concatenated String = ", concatStr.value);
console.log(concatStr instanceof SecurityTypeHigh); //true