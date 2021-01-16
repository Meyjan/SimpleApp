const mongoose = require('mongoose');
const dbUrl = process.env.DB_URL;
const poolSize = process.env.DB_POOL_SIZE;
const userCollectionName = process.env.USER_COLLECTION_NAME;
const refreshDuration = parseInt(process.env.REFRESH_DURATION);

const db = mongoose.createConnection(dbUrl, { poolSize: poolSize, useNewUrlParser: true, useUnifiedTopology: true })

module.exports = {
    conn: () => {
        return db;
    },
    
    getUserSchema: () => {
        const userSchema = new mongoose.Schema({
            username: String,
            password: String,
            role: String,
        });
        return userSchema;
    },

    getRefreshTokenSchema: () => {
        let today = new Date();
        today.setSeconds(today.getSeconds() + refreshDuration)
        const refreshTokenSchema = new mongoose.Schema({
            token: String,
            userId: { type: mongoose.Schema.Types.ObjectId, ref : userCollectionName},
            expiresAt: { type: Date, default: today, expires: '5s' },
        });
        return refreshTokenSchema;
    }
}