import { SecurityWrapper, SecurityTypeHigh, SecurityTypeLow } from "./SecurityTypes";

// const StringHProxy1 = SecurityWrapper("Private String 1", "H");
// const StringLProxy2 = SecurityWrapper("Public String 2", "L");

// console.log(StringHProxy1);
// console.log(StringLProxy2);
// const ch = StringHProxy1.charAt(2);
// console.log("Extracted char = ", ch);
// const subSt = StringLProxy2.substring(0, 6);
// console.log("Extracted substring = ", subSt);
// const concatStr = StringHProxy1.concat(" ").concat(StringLProxy2);
// console.log("Concatenated String = ", concatStr);
// console.log(concatStr instanceof SecurityTypeHigh);
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

// function leakTest() {
//     let x = SecurityWrapper(true, "L");
//     x = true;
//     x = SecurityWrapper
// }

function leak2(secret: SecurityTypeHigh | SecurityTypeLow) {
    let x = true;
    if(secret.securityValue) {
        console.log();
        //@jjIgnoreInformationFlow
        x = SecurityWrapper(true, "H");
    }

    let y = false;
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

// @IgnoreInformationFlow - tells that below information leak is safe (ignore below line from linting)
function leak3(secret: SecurityTypeHigh | SecurityTypeLow) {
    if(secret.securityValue > 5) {
        throw new Error(secret.securityValue);
    }

    //below, even if exception not thrown, information is leaked that secret's value is less than 5 (assuming source code is available with the hacker)
    //TODO: prevent the below leak
    return true;
}

let isGreaterThanFive = false;
try {
    leak3(SecurityWrapper(10, "H"));
} catch(err) {
    isGreaterThanFive = true;
    let lowLeaked = err.message;
    console.log(lowLeaked);
}


//Implemented ignore rules
//@IgnoreInformationFlow - tells that below information leak is safe (ignore below line from linting)