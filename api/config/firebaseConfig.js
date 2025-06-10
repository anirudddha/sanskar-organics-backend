// api/config/firebaseConfig.js
const admin = require('firebase-admin');
const dotenv = require('dotenv'); // Ensure dotenv is loaded for this file as well if it's accessed independently

dotenv.config({ path: './.env' }); // Load .env file specific to the api folder

const initializeFirebaseAdmin = () => {
    try {
        if (admin.apps.length === 0) { // Check if Firebase app is already initialized to prevent re-initialization
            const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

            if (!serviceAccountBase64) {
                console.error("FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not defined in .env file.");
                throw new Error("Firebase service account key is missing. Please ensure your .env is correctly configured.");
            }

            // Decode the base64 string and parse it as JSON
            const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin SDK initialized successfully.");
        }
    } catch (error) {
        console.error("Error initializing Firebase Admin SDK:", error.message);
        // Depending on your deployment, you might want to exit the process
        // or just log an error and handle it gracefully at the server startup.
        // For production, exiting is often preferred if a critical dependency fails.
        process.exit(1);
    }
};

module.exports = { admin, initializeFirebaseAdmin };