const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ResponseGenerator = require('../utils/responseGenerator');
const e = require('express');

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;
const userCollectionName = 'users'

const roleList = ['admin', 'user']

// Async functions
findUser = (collection, username, callback) => {
    const query = { username: username };
    collection.findOne(query, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    })
}

createUser = (collection, user, callback) => {
    const { username, password, role } = user;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const obj = {
        username: username,
        password: hashedPassword,
        role: role
    }
    collection.insertOne(obj, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

// Sync functions
comparePassword = (user, password) => {
    const hashedPassword = user.password;
    return bcrypt.compareSync(password, hashedPassword);
}

// Exported modules
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
    },

    create: (req, res) => {
        const { user, body, db } = req;
        const { username, password, role } = body;

        if (user.role === 'admin') {
            if (username && password && role) {
                // Check if user exists
                const collection = db.collection(userCollectionName);

                // Validating role list
                if (!roleList.includes(role)) {
                    ResponseGenerator(res, 400, "Role invalid");
                } else {
                    // Check if username exists
                    findUser(collection, username, (err, result) => {
                        if (err) throw err;
                        if (result) {
                            ResponseGenerator(res, 400, "Username exists. Change for another username!");
                        } else {
                            createUser(collection, body, (err, result) => {
                                if (err) throw err;
                                ResponseGenerator(res, 200, "OK");
                            });
                        }
                    });
                }
            } else {
                ResponseGenerator(res, 400, "Username, password, and role cannot be empty");
            }
        } else {
            ResponseGenerator(res, 401, "Unauthorized");
        }
    }
}