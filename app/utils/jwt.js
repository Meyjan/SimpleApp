const expressJwt = require("express-jwt");

module.exports = () => {
    const secret = process.env.JWT_SECRET;
    return expressJwt({ secret }).unless ({
        path: [
            "/",
            "/login"
        ]
    })
}