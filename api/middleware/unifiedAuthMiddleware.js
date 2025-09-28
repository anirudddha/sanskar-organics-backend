// api/middleware/unifiedAuthMiddleware.js

const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebaseConfig');

const unifiedAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authorization token required (Bearer token)." });
    }

    const token = authHeader.split('Bearer ')[1];

    // --- STRATEGY ---
    // 1. Try to verify as a Firebase ID token first.
    // 2. If that fails, assume it might be a local JWT and try to verify that.
    // 3. If both fail, the token is invalid.

    try {
        // Step 1: Attempt Firebase verification
        const decodedFirebaseToken = await admin.auth().verifyIdToken(token);

        // Standardize the user object attached to the request
        req.user = {
            userId: decodedFirebaseToken.uid,
            email: decodedFirebaseToken.email,
            authMethod: 'firebase' // For debugging or specific logic later
        };
        console.log("Firebase user authenticated:", req.user.userId);
        return next(); // Authentication successful, move on

    } catch (firebaseError) {
        // Firebase verification failed. It could be an expired Firebase token,
        // an invalid one, OR our own local JWT. Now we try to verify it as a local JWT.

        try {
            // Step 2: Attempt local JWT verification
            const decodedLocalToken = jwt.verify(token, process.env.JWT_SECRET);
            
            // Standardize the user object
            req.user = {
                userId: decodedLocalToken.userId, // This is the MongoDB _id
                email: decodedLocalToken.email,
                authMethod: 'local'
            };
            console.log("Local user authenticated:", req.user.userId);
            return next(); // Authentication successful

        } catch (jwtError) {
            // Step 3: Both methods failed. The token is truly invalid.
            console.error("Token verification failed for both Firebase and JWT:", { 
                firebaseError: firebaseError.code, 
                jwtError: jwtError.name 
            });
            return res.status(401).json({ message: "Invalid or expired token." });
        }
    }
};

module.exports = unifiedAuthMiddleware;