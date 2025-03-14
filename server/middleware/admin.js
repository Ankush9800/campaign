const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const admin = async (req, res, next) => {
    try {
        // Get token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find admin user
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ error: 'Access denied. Invalid token.' });
        }

        // Add admin user to request
        req.user = admin;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = admin;
