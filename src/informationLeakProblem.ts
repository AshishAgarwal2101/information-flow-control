import { SecurityWrapper, SecurityTypeHigh, SecurityTypeLow } from "./SecurityTypes";

function leak1(secret: SecurityTypeHigh | SecurityTypeLow) {
    let x = SecurityWrapper(true, "L");
    if(secret.value) {
        x = SecurityWrapper(false, "L");
    }

    return x;
}

function leak2(secret: SecurityTypeHigh | SecurityTypeLow) {
    let x = true;
    if(secret.value) {
        //@IgnoreInformationFlow
        x = SecurityWrapper(true, "H");
    }

    let y = false;
    if(x !== true) {
        y = true;
    }
    return y;
}

function leak3(secret: SecurityTypeHigh) {
    if(secret.value > 5) {
        throw new Error("The value of secret is " + secret.value + ", which does not satisfy requirements.");
    }
    return "Secret value is less than 5";
}

function leak4(secret: SecurityTypeHigh) {
    console.log("Secret value is " + secret.value);
}

function sendViaApi(secret: SecurityTypeHigh) {
    try {
        return leak3(secret);
    } catch(e) {
        return e.message;
    }
}

console.log("--------------------------------INFORMATION LEAK PROBLEM------------------------------------------");
console.log(leak1(SecurityWrapper(false, "H")));
console.log(leak2(SecurityWrapper(true, "H")));
console.log(sendViaApi(SecurityWrapper(4, "H")));
console.log(sendViaApi(SecurityWrapper(14, "H")));
leak4(SecurityWrapper(56, "H"));