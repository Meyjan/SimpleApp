const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Login
router.post('/login', userController.login);

// Create
// router.post('/create', userController.create);

// Read
// router.get('/read/:userId', userController.read);

// Update
// router.put('/update', userController.update);

// Delete
// router.delete('/delete/:userId', userController.delete);

module.exports = router;