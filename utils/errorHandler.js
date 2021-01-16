const ResponseGenerator = require('./responseGenerator');

module.exports = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        ResponseGenerator(res, 401, 'Unauthorized');
    } else {
        ResponseGenerator(res, 500, 'Internal server error');
    }
}