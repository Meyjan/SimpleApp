'use strict';

// Imports
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

require("dotenv").config();
const jwt = require('./utils/jwt');
const userRouter = require('./routers/userRouter');
const errorHandler = require('./utils/errorHandler');

// Constants
const PORT = 3000;
// const HOST = '0.0.0.0';
const app = express();
let db;

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(jwt());
app.use(errorHandler);

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

