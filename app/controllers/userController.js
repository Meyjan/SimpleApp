// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ResponseGenerator = require('../utils/responseGenerator');

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;
const userCollectionName = 'users'

findUser = (collection, username, callback) => {
    const query = { username: username };
    collection.findOne(query, (err, result) => {
        if (err) return callback(err);
        callback(null, result);
    })
}

comparePassword = (user, password) => {
    const hashedPassword = user.password;
    return bcrypt.compareSync(password, hashedPassword);
}

module.exports = {
    login: (req, res) => {
        const { body, db } = req;
        const { username, password } = body;

        if (username && password) {
            const collection = db.collection(userCollectionName);
            findUser(collection, username, (err, result) => {
                if (err) throw err;
                if (result) {
                    const validUser = comparePassword(result, password);
                    if (validUser) {
                        const userData = {
                            userid: result._id,
                            username: result.username,
                            role: result.role
                        };

                        const token = jwt.sign(userData, jwtSecret);
                        const status = 200;
                        const response = {
                            status,
                            token
                        };

                        res.status(status).json(response);
                        ResponseGenerator(res, 200);
                        
                    } else {
                        ResponseGenerator(res, 401, "Password is not correct");
                    }
                } else {
                    ResponseGenerator(res, 401, "Username is not found");
                }
            });

        } else {
            ResponseGenerator(res, 400, "Username and password cannot be empty.")
        }
    }
}