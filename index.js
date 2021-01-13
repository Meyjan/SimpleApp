'use strict';

// Imports
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

require("dotenv").config();
const jwt = require('./utils/jwt');
const { MongoClient } = require('mongodb');

const userRouter = require('./routers/userRouter');

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
MongoClient.connect(process.env.DB_URL, { useNewUrlParser: true, poolSize: 5, useUnifiedTopology: true }, (err, database) => {
  if (err) throw err;
  db = database.db();

  app.listen(PORT);
  console.log(`Running on port: ${PORT}`);
});

