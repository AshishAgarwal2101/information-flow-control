export class SecurityTypeHigh {
    value: any;
    securityLevel: string;
    constructor(value: any) {
        this.value = value;
        this.securityLevel = "H";
    }
}

export class SecurityTypeLow {
    value: any;
    securityLevel: string;
    constructor(value: any) {
        this.value = value;
        this.securityLevel = "L";
    }
}

function instanceOfSecurityType(object: any) {
    return object instanceof SecurityTypeHigh 
        || object instanceof SecurityTypeLow;
}

export const SecurityWrapper = (value: any, securityLevel: string) => {
    let res: SecurityTypeHigh | SecurityTypeLow;
    if(securityLevel === "H") {
        res = new SecurityTypeHigh(value);
    }
    else {
        res = new SecurityTypeLow(value);
    }
    return new Proxy(res, proxyHandlerSt);
}

const proxyHandlerSt = {
    get(target: any, prop: any): any {
        //when actual values of SecurityType are asked
        if(prop === "value") {
            return Reflect.get(target, prop);
        }

        const prim = Reflect.get(target, 'value');
        const targetSecurityType = Reflect.get(target, 'securityLevel');
        const value = prim[prop];

        //Not a function, just a normal value asked
        if(typeof value !== 'function'){
            return SecurityWrapper(value, targetSecurityType);
        }

        //when function is asked, return a wrapped function
        const toBeCalledFunc = value.bind(prim);
        return (...args: any[]) => {
            let maxSecurityLevel = targetSecurityType;
            const updatedArgs = args.map((arg) => {
                if(instanceOfSecurityType(arg)) {
                    const argValue = Reflect.get(arg, "value", arg);
                    const argSecurityLevel = Reflect.get(arg, "securityLevel", arg);
                    if(argSecurityLevel === "H") {
                        maxSecurityLevel = "H";
                    }
                    return argValue;
                }
                return arg;
            });

            return SecurityWrapper(toBeCalledFunc(...updatedArgs), maxSecurityLevel);
        };
    }
};

