// api/middleware/jwtAuthMiddleware.js

const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required (Bearer token).' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the JWT using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to the request object.
        // It's good practice to use the same property name (e.g., req.user)
        // to make your controllers more consistent.
        req.user = { 
            userId: decoded.userId, // This is the MongoDB _id
            email: decoded.email,
            authMethod: 'local' 
        };
        console.log("Local JWT user authenticated:", req.user.userId);
        
        next();
    } catch (error) {
        console.error("JWT verification error:", error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired. Please log in again.' });
        }
        // This will correctly fail if someone tries to use a Firebase token here.
        return res.status(401).json({ message: 'Invalid token for this endpoint. Authorization denied.' });
    }
};

module.exports = jwtAuthMiddleware;