const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const ResponseGenerator = require('../utils/responseGenerator');
const e = require('express');
const { ObjectId } = require('mongodb');

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;
const userCollectionName = 'users'

const roleList = ['admin', 'user']

// Async functions
findUserByUsername = (collection, username, callback) => {
    const query = { username: username };
    collection.findOne(query, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

findUserById = (collection, id, callback) => {
    const query = { _id:  ObjectId(id) };
    collection.findOne(query, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

findUsers = (collection, username, callback) => {
    const query = { username: new RegExp(username, 'i')};
    collection.find(query).toArray((err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
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

updateUserById = (collection, id, newUser, callback) => {
    const { username, password, role } = newUser;
    let newUserObj = {};
    if (username) newUserObj.username = username;
    if (password) newUserObj.password = bcrypt.hashSync(password, saltRounds);
    if (role) newUserObj.role = role;

    const query = { _id:  ObjectId(id) };
    const updatedObj = { $set: newUserObj };
    const upsert = { upsert: true };
    
    collection.updateOne(query, updatedObj, upsert, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    })
}

deleteUserById = (collection, id, callback) => {
    const query = { _id:  ObjectId(id) };
    collection.remove(query, (err, result) => {
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
            findUserByUsername(collection, username, (err, result) => {
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
                    findUserByUsername(collection, username, (err, result) => {
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
    },

    read: (req, res) => {
        const { params, db } = req;
        let { username } = params;
        const collection = db.collection(userCollectionName);

        if (!username) username = '';
        findUsers(collection, username, (err, result) => {
            if (err) throw err;
            
            const statusCode = 200;
            res.status(statusCode).json(result);
        })
    },

    readById: (req, res) => {
        const { params, db } = req;
        let { id } = params;
        const collection = db.collection(userCollectionName);

        if (id) {
            findUserById(collection, id, (err, result) => {
                if (err) throw err;
                
                const statusCode = 200;
                res.status(statusCode).json(result);
            })
        } else {
            ResponseGenerator(res, 400, "Id has to be not null");
        }  
    },

    update: (req, res) => {
        const { user, params, body, db } = req;
        const { username, password, role } = body;
        let { id } = params;

        if (user.role === 'admin') {
            if (username || password || role) {
                // Check if user exists
                const collection = db.collection(userCollectionName);

                // Validating role list
                if (!roleList.includes(role)) {
                    ResponseGenerator(res, 400, "Role invalid");
                } else {
                    // Check if username exists
                    findUserById(collection, id, (err, result) => {
                        if (err) throw err;
                        if (result) {
                            updateUserById(collection, id, body, (err, result) => {
                                if (err) throw err;
                                ResponseGenerator(res, 200, "OK", body);
                            });
                        } else {
                            ResponseGenerator(res, 400, "Id does not exist. Cannot update.");
                        }
                    });
                }
            } else {
                ResponseGenerator(res, 400, "At least a username, a password, or a role has to exist");
            }
        } else {
            ResponseGenerator(res, 401, "Unauthorized");
        }
    },

    delete: (req, res) => {
        const { params, db } = req;
        let { id } = params;
        const collection = db.collection(userCollectionName);

        if (id) {
            findUserById(collection, id, (err, result) => {
                if (err) throw err;
                if (result) {
                    deleteUserById(collection, id, (err, result) => {
                        if (err) throw err;
                        ResponseGenerator(res, 200, "OK");
                    });
                } else {
                    ResponseGenerator(res, 400, "Id does not exist. Cannot delete.");
                }
            })
        } else {
            ResponseGenerator(res, 400, "Id has to be not null");
        }
    }
}