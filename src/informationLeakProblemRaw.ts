interface SecurityType {
    securityValue: any;
    securityLevel: String;
}

let StringHSecurity_1: SecurityType = {
    securityValue: true,
    securityLevel: "H"
};
let StringLSecurity_1: SecurityType = {
    securityValue: false,
    securityLevel: "L"
};

function leak(secret: boolean): boolean {
    let x = true;
    if(secret) x = false;
    let y = true;
    if(x) y = false;
    return y;
}

