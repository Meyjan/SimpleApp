const mongoose = require('mongoose');
const dbUrl = process.env.DB_URL;
const poolSize = process.env.DB_POOL_SIZE;

const db = mongoose.createConnection(dbUrl, { poolSize: poolSize, useNewUrlParser: true, useUnifiedTopology: true })

module.exports = () => {
    return db;
}