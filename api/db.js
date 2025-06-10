// db.js
const { MongoClient, ServerApiVersion } = require('mongodb');

let _db; // Private variable to hold the database instance
let _client; // Private variable to hold the MongoClient instance

const connectToMongoDB = async () => {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error("MONGODB_URI is not defined in .env file.");
        process.exit(1); // Exit if connection string is missing
    }

    _client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await _client.connect();
        _db = _client.db('SanskarOrganics'); // Replace with your actual database name on Atlas
        console.log("Connected to MongoDB Atlas!");
        return _db;
    } catch (error) {
        console.error("Error connecting to MongoDB Atlas:", error);
        throw error; // Propagate the error
    }
};

const getDb = () => {
    if (!_db) {
        throw Error('No database found! Please connect first.');
    }
    return _db;
};

const getClient = () => {
    if (!_client) {
        throw Error('No MongoDB client found! Please connect first.');
    }
    return _client;
};

const closeMongoDB = async () => {
    if (_client) {
        await _client.close();
        console.log("MongoDB connection closed.");
        _db = null; // Clear the database instance
        _client = null; // Clear the client instance
    }
};

module.exports = {
    connectToMongoDB,
    getDb,
    getClient,
    closeMongoDB
};