'use strict';

// Imports
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

require("dotenv").config();
const jwt = require('./utils/jwt');
const { MongoClient } = require('mongodb');

const userRouter = require('./routers/userRouter');
const ResponseGenerator = require('./utils/responseGenerator');

// Constants
const PORT = 3000;
// const HOST = '0.0.0.0';
const app = express();
let db;

// Library middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(jwt());

// Handling error from jwt authorization
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    ResponseGenerator(res, 401, 'Unauthorized');
  }
});

// Passing spawned database connection to controller
app.use((req, res, next) => {
  req.db = db;
  next();
})

// Normal connection
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Routes to controllers
app.use('', userRouter);

// Initiate database and listen
MongoClient.connect(process.env.DB_URL, { useNewUrlParser: true, poolSize: 5, useUnifiedTopology: true }, (err, database) => {
  if (err) throw err;
  db = database.db();

  app.listen(PORT);
  console.log(`Running on port: ${PORT}`);
});

