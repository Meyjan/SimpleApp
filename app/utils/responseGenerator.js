module.exports = (response, status, message, data) => {
    return response.status(status).json({
        status,
        message,
        data
    });
}