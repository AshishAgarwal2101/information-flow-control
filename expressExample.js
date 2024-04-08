const express = require("express");
const app = express();
const port = 3000;

app.listen(port, () => {
  console.log("App listening on port ${port}");
});

let secret = SecurityWrapper(12, "H");

app.get("/validateSecret", (_, res) => {
    try {
        res.send(leak(secret));
    } catch(e) {
        res.send(e.message);
    }
});