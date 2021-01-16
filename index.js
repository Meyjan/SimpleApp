'use strict';

// Imports
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')

require("dotenv").config();
const jwt = require('./utils/jwt');
const userRouter = require('./routers/userRouter');
const errorHandler = require('./utils/errorHandler');
const ResponseGenerator = require('./utils/responseGenerator');

// Constants
const PORT = 3000;
const app = express();

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(jwt());

// Normal connection
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Routes to controllers
app.use('', userRouter);

app.use((req, res, next) => {
  ResponseGenerator(res, 404, 'Not Found');
})

app.use(methodOverride())
app.use(errorHandler);

// Initiate database and listen
app.listen(PORT);
console.log(`Running on port: ${PORT}`);

