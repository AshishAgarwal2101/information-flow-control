function hello(name: String) {
    return "Hello " + name;
}

hello("Ashish");




function sendViaApi(secret: SecurityTypeHigh | SecurityTypeLow) {
    try {
        return leak(secret);
    } catch(e) {
        return e.message;
    }
}