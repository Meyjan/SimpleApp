const MongoClient = require('mongodb').MongoClient;

const DB_URI = process.env.DB_URI

function connect(url) {
    return MongoClient.connect(url).then(client => client.db())
}

module.exports = async () =>  {
    let databases = await Promise(connect(DB_URI));
    return databases;
}