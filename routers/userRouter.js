const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Login
router.post('/login', userController.login);

// Create
router.post('/create', userController.create);

// Read
router.get('/read', userController.read);
router.get('/readId', userController.read);
router.get('/read/:username', userController.read);
router.get('/readId/:id', userController.readById);

// Update
router.put('/update/:id', userController.update);

// Delete
router.delete('/delete/:id', userController.delete);

// Refresh token
router.get('/getRefresh', userController.getRefreshToken);
router.post('/refresh', userController.refreshAccessToken);

// Go error
router.get('/error', userController.goError);

module.exports = router;