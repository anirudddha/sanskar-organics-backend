// api/middleware/firebaseAuthMiddleware.js
const { admin } = require('../config/firebaseConfig'); // Ensure Firebase Admin SDK is initialized

const firebaseAuthMiddleware = async (req, res, next) => {
    // Check if the Authorization header is present and correctly formatted
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authorization token required (Bearer token)." });
    }

    const idToken = authHeader.split('Bearer ')[1]; // Extract the ID token

    try {
        // Verify the ID token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Attach the decoded token (which contains user UID and other claims)
        // to the request object for subsequent middleware/route handlers
        req.firebaseUser = decodedToken;
        console.log("Firebase user authenticated:", decodedToken.uid); // Log the authenticated user's UID

        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("Error verifying Firebase ID token:", error.message);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: "Firebase ID token expired. Please re-authenticate." });
        }
        // Catch other Firebase authentication errors (e.g., malformed token, invalid token)
        return res.status(401).json({ message: "Invalid or unauthorized token." });
    }
};

module.exports = firebaseAuthMiddleware;