const expressJwt = require("express-jwt");

module.exports = () => {
    const secret = process.env.JWT_SECRET;
    return expressJwt({ secret, algorithms: ['sha1', 'RS256', 'HS256'] }).unless ({
        path: [
            "/",
            "/login",
            "/refresh"
        ]
    })
}