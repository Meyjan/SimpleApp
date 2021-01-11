const expressJwt = require("express-jwt");

module.exports = () => {
    const secret = process.env.JWT_SECRET;
    console.log("Secret is:", secret);
    return expressJwt({ secret, algorithms: ['RS256'] }).unless ({
        path: [
            "/",
            "/login"
        ]
    })
}