// interface SecurityType {
//     securityValue: any;
//     securityLevel: String;
// }

// function instanceOfSecurityType(object: any): object is SecurityType {
//     return typeof object === "object" && "securityLevel" in object;
// }

// let proxyHandlerSt = {
//     get(target: any, prop: any, receiver: any): any {
//         //when actual values of SecurityType are asked
//         if(prop === "securityValue" || prop === "securityLevel") {
//             return Reflect.get(target, prop);
//         }

//         const prim = Reflect.get(target, 'securityValue');
//         const targetSecurityType = Reflect.get(target, 'securityLevel');
//         const value = prim[prop];

//         //Not a function, just a normal value asked
//         if(typeof value !== 'function'){
//             let res: SecurityType = {securityValue: value, securityLevel: targetSecurityType};
//             return new Proxy(res, proxyHandlerSt);
//         }

//         //when function is asked, return a wrapped function
//         let toBeCalledFunc = value.bind(prim);
//         return (...args: any[]) => {
//             let maxSecurityLevel = targetSecurityType;
//             let updatedArgs = args.map((arg) => {
//                 if(instanceOfSecurityType(arg)) {
//                     let argValue = Reflect.get(arg, "securityValue", arg);
//                     let argSecurityLevel = Reflect.get(arg, "securityLevel", arg);
//                     if(argSecurityLevel === "H") {
//                         maxSecurityLevel = "H";
//                     }
//                     return argValue;
//                 }
//                 return arg;
//             });

//             let res: SecurityType = {securityValue: toBeCalledFunc(...updatedArgs), securityLevel: targetSecurityType};
//             return new Proxy(res, proxyHandlerSt);
//         };
//         //return typeof value === 'function' ? value.bind(prim) : value;
//     }
// };

// let StringHSecurity: SecurityType = {
//     securityValue: "Private String 1",
//     securityLevel: "H"
// };
// let StringLSecurity: SecurityType = {
//     securityValue: "Public String 2",
//     securityLevel: "L"
// };

// let StringHProxy1 = new Proxy(StringHSecurity, proxyHandlerSt);
// let StringLProxy2 = new Proxy(StringLSecurity, proxyHandlerSt);

// console.log(StringHProxy1);
// console.log(StringLProxy2);
// let ch = StringHProxy1.charAt(2);
// console.log("Extracted char = ", ch);
// let subSt = StringLProxy2.substring(0, 6);
// console.log("Extracted substring = ", subSt);
// let concatStr = StringHProxy1.concat(" ").concat(StringLProxy2);
// console.log("Concatenated String = ", concatStr);
// //console.log(StringHProxy1 + StringHProxy2);