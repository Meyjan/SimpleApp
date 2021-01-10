'use strict';

// Imports
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const jwt = require('./utils/jwt');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(jwt());

app.get('/', (req, res) => {
  res.send('Hello World');
});

// Routes


app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);