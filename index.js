'use strict';

// Imports
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

require("dotenv").config();
const jwt = require('./utils/jwt');
const userRouter = require('./routers/userRouter');
const errorHandler = require('./utils/errorHandler');

// Constants
const PORT = 3000;
const app = express();

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(jwt());
app.use(errorHandler);

// Normal connection
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Routes to controllers
app.use('', userRouter);

// Initiate database and listen
app.listen(PORT);
console.log(`Running on port: ${PORT}`);

