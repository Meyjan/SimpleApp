'use strict';

// Imports
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const jwt = require('./utils/jwt');
const mongoClient = require('mongodb').MongoClient;

const userRouter = require('./routers/userRouter');

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';
const app = express();
let db;

// Library middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(jwt());

// Database connection
app.use((req, res, next) => {
  req.db = db;
  next();
})

// Normal connection
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Routes
app.use('', userRouter);

// Initiate
mongoClient.connect(process.env.DB_URL, (err, database) => {
  if(err) {
    throw err;
  }
  
  db = database;
  app.listen(PORT, HOST);
  console.log(`Running on http://${HOST}:${PORT}`);
});

