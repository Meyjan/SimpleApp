const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const ResponseGenerator = require('../utils/responseGenerator');
const dbConn = require('../utils/db');
const { ObjectId } = require('mongodb');

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;

const userCollectionName = process.env.USER_COLLECTION_NAME;
const refreshTokenCollectionName = process.env.REFRESH_TOKEN_COLLECTION_NAME;

const roleList = ['admin', 'user']
const db = dbConn.conn();
const userCollection = db.collection(userCollectionName);
const refreshTokenCollection = db.collection(refreshTokenCollectionName);

const accessTokenDuration = parseInt(process.env.JWT_DURATION);
const refreshTokenSchema = dbConn.getRefreshTokenSchema();
const RefreshTokenModel = db.model(refreshTokenCollectionName, refreshTokenSchema);

// Async functions
findUserByUsername = (username, callback) => {
    const query = { username: username };

    userCollection.findOne(query, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

findUserById = (id, callback) => {
    const query = { _id:  ObjectId(id) };
    userCollection.findOne(query, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

findUsers = (username, callback) => {
    const query = { username: new RegExp(username, 'i')};
    userCollection.find(query).toArray((err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

createUser = (user, callback) => {
    const { username, password, role } = user;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    const obj = {
        username: username,
        password: hashedPassword,
        role: role
    }
    userCollection.insertOne(obj, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

updateUserById = (id, newUser, callback) => {
    const { username, password, role } = newUser;
    let newUserObj = {};
    if (username) newUserObj.username = username;
    if (password) newUserObj.password = bcrypt.hashSync(password, saltRounds);
    if (role) newUserObj.role = role;

    const query = { _id:  ObjectId(id) };
    const updatedObj = { $set: newUserObj };
    const upsert = { upsert: true };
    
    userCollection.updateOne(query, updatedObj, upsert, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    })
}

deleteUserById = (id, callback) => {
    const query = { _id:  ObjectId(id) };
    userCollection.deleteOne(query, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    });
}

findRefreshToken = (token, callback) => {
    const query = { token: token };
    refreshTokenCollection.findOne(query, (err, result) => {
        if (err) return callback(err);
        return callback(null, result);
    })
}

createRefreshToken = (user, callback) => {
    const randomToken = generateRandomToken();
    const userId = user._id;

    const tempUser = { userid: userId };
    let savedToken;

    findRefreshTokenUser(tempUser, (err, result) => {
        if (err) return callback(err);
        if (result) {
            const existingId = result._id;
            savedToken = new RefreshTokenModel({ _id: existingId, token: randomToken, userId: userId })
            savedToken.isNew = false;
        } else {
            savedToken = new RefreshTokenModel({ token: randomToken, userId: userId })
        }

        savedToken.save((err, result) => {
            if (err) return callback(err);
            return callback(null, randomToken);
        })
    })
}

findRefreshTokenUser = (user, callback) => {
    const userId = user.userid;
    const query = { userId: userId };

    RefreshTokenModel.findOne(query, (err, result) => {
        if (err) return callback (err);
        return callback(null, result);
    })
}

// Sync functions
comparePassword = (user, password) => {
    const hashedPassword = user.password;
    return bcrypt.compareSync(password, hashedPassword);
}

generateRandomToken = () => {
    return crypto.randomBytes(30).toString('hex');
}

validatePassword = (password) => {
    const validateLowerCase = /[a-z]/g;
    const validateUpperCase = /[A-Z]/g;
    const validateNumbers = /[0-9]/g;

    if (password.length >= 8) {
        if (!password.match(validateLowerCase)) {
            return 'Password has to contain at least 1 lowercase';
        }
        if (!password.match(validateUpperCase)) {
            return 'Password has to contain at least 1 uppercase';
        }
        if (!password.match(validateNumbers)) {
            return 'Password has to contain at least 1 number';
        }
        return null;
    } else {
        return 'Password length has to be at least 8 characters';
    }
}

// Exported modules
module.exports = {
    login: (req, res, next) => {
        const { username, password } = req.body;

        if (username && password) {
            findUserByUsername(username, (err, result) => {
                if (err) throw err;
                if (result) {
                    const validUser = comparePassword(result, password);
                    if (validUser) {
                        createRefreshToken(result, (err, result_token) => {
                            if (err) throw err;
                            let userData = {
                                userid: result._id,
                                username: result.username,
                                role: result.role,
                            };

                            const token = jwt.sign(userData, jwtSecret, { expiresIn: accessTokenDuration });
                            const status = 200;

                            userData.accessToken = token;
                            userData.refreshToken = result_token;

                            const response = {
                                status,
                                userData
                            };
                            res.status(status).json(response);
                        });                        
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

    create: (req, res, next) => {
        const { user, body } = req;
        const { username, password, role } = body;

        if (user.role === 'admin') {
            if (username && password && role) {
                // Validating role list
                if (!roleList.includes(role)) {
                    ResponseGenerator(res, 400, "Role invalid");
                } else {
                    const passwordCheck = validatePassword(password);
                    if (passwordCheck) {
                        return ResponseGenerator(res, 400, passwordCheck);
                    }
                    // Check if username exists
                    findUserByUsername(username, (err, result) => {
                        if (err) throw err;
                        if (result) {
                            ResponseGenerator(res, 400, "Username exists. Change for another username!");
                        } else {
                            createUser(body, (err, result) => {
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

    read: (req, res, next) => {
        let { username } = req.params;

        if (!username) username = '';
        findUsers(username, (err, result) => {
            if (err) throw err;
            
            const statusCode = 200;
            res.status(statusCode).json(result);
        })
    },

    readById: (req, res, next) => {
        let { id } = req.params;

        if (id) {
            findUserById(id, (err, result) => {
                if (err) throw err;
                const statusCode = 200;
                res.status(statusCode).json(result);
            })
        } else {
            ResponseGenerator(res, 400, "Id has to be not null");
        }  
    },

    update: (req, res, next) => {
        const { user, params, body } = req;
        const { username, password, role } = body;
        let { id } = params;

        if (user.role === 'admin') {
            if (username || password || role) {
                // Validating role list
                if (!roleList.includes(role)) {
                    ResponseGenerator(res, 400, "Role invalid");
                } else {
                    if (password) {
                        const passwordCheck = validatePassword(password);
                        if (passwordCheck) {
                            return ResponseGenerator(res, 400, passwordCheck);
                        }
                    }
                    // Check if username exists
                    findUserById(id, (err, result) => {
                        if (err) throw err;
                        if (result) {
                            // Check if username exists
                            findUserByUsername(username, (err, result) => {
                                if (err) throw err;
                                if (result) {
                                    ResponseGenerator(res, 400, "Username exists. Change for another username!");
                                } else {
                                    updateUserById(id, body, (err, result) => {
                                        if (err) throw err;
                                        ResponseGenerator(res, 200, "OK", body);
                                    });
                                }
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

    delete: (req, res, next) => {
        const { user, params } = req;
        let { id } = params;

        if (user.role === 'admin') {
            if (id) {
                findUserById(id, (err, result) => {
                    if (err) throw err;
                    if (result) {
                        deleteUserById(id, (err, result) => {
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
        } else {
            ResponseGenerator(res, 401, "Unauthorized");
        }
    },

    getRefreshToken: (req, res, next) => {
        findRefreshTokenUser(req.user, (err, result) => {
            if (err) throw err;
            if (result) {
                ResponseGenerator(res, 200, "OK", result);
            } else {
                ResponseGenerator(res, 404, "Not Found");
            }
        });
    },

    refreshAccessToken: (req, res, next) => {
        const { refreshToken, username } = req.body;

        if (refreshToken && username) {
            findUserByUsername(username, (err, result) => {
                if (err) return next(err);
                if (result) {
                    let tempUser = result;
                    tempUser.userid = result._id;
                    findRefreshTokenUser(tempUser, (err, resultToken) => {
                        if (err) throw err;
                        if (resultToken) {
                            const dbRefreshToken = resultToken.token;
                            if (refreshToken === dbRefreshToken) {
                                createRefreshToken(result, (err, result_token) => {
                                    if (err) throw err;
                                    let userData = {
                                        userid: result._id,
                                        username: result.username,
                                        role: result.role,
                                    };
        
                                    const token = jwt.sign(userData, jwtSecret, { expiresIn: accessTokenDuration });
                                    const status = 200;
        
                                    userData.accessToken = token;
                                    userData.refreshToken = result_token;
        
                                    const response = {
                                        status,
                                        userData
                                    };
                                    res.status(status).json(response);
                                });
                            } else {
                                ResponseGenerator(res, 401, "Unauthorized refresh token.")
                            }
                        } else {
                            ResponseGenerator(res, 404, "User does not have refresh token active.");
                        }
                    });
                } else {
                    ResponseGenerator(res, 400, 'User does not exist');
                }
            });
        } else {
            ResponseGenerator(res, 400, 'Need refresh token and username in body');
        }
    },

    goError: (req, res, next) => {
        next(req);
    }
}