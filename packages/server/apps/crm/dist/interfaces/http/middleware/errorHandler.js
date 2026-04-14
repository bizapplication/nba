"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(error, _req, res, _next) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
}
