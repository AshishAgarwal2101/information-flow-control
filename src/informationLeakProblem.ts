import { SecurityWrapper, SecurityTypeHigh, SecurityTypeLow } from "./SecurityTypes";

const StringHProxy1 = SecurityWrapper("Private String 1", "H");
const StringLProxy2 = SecurityWrapper("Public String 2", "L");

console.log(StringHProxy1);
console.log(StringLProxy2);
const ch = StringHProxy1.charAt(2);
console.log("Extracted char = ", ch);
const subSt = StringLProxy2.substring(0, 6);
console.log("Extracted substring = ", subSt);
const concatStr = StringHProxy1.concat(" ").concat(StringLProxy2);
console.log("Concatenated String = ", concatStr);
console.log(concatStr instanceof SecurityTypeHigh);
//console.log(StringHProxy1 + StringHProxy2);




//--------------------------------INFORMATION LEAK PROBLEM------------------------------------------//
function leak1(secret: SecurityTypeHigh | SecurityTypeLow) {
    let x = SecurityWrapper(true, "L");
    if(secret.securityValue) {
        x = SecurityWrapper(false, "L");
    }

    let y: SecurityTypeLow = SecurityWrapper(true, "L");
    if(x.securityValue) {
        y = SecurityWrapper(false, "L");
    }
    return y;
}

function leak2(secret: SecurityTypeHigh | SecurityTypeLow) {
    let x: any = true;
    if(secret.securityValue) {
        x = SecurityWrapper(false, "H");
    }

    let y = false;
    //console.log("----", typeof x);
    if(x !== true) {
        y = true;
    }
    return y;
}

//Two ways to solve leak2:
//1. Enforce that SecurityTypeHigh or SecurityTypeLow can only be assigned if their types are declared so. A variable with "any" type cannot have SecurityTypeHigh value.
//2. Always consider the highest security level for a variable, even if taken inside an if block. For example, variable "x"'s type changes from any to SecurityTypeHigh inside the if block. Consider x's type to be SecurityTypeHigh for the next x's usage.

console.log("--------------------------------INFORMATION LEAK PROBLEM------------------------------------------");
console.log(leak2(SecurityWrapper(false, "H")));
