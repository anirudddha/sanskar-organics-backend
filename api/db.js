// db.js
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not defined.");
  process.exit(1);
}

// Cache the connect() promise in the global scope to survive hot-reloads
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  global._mongoClientPromise = client.connect();
}

async function getDb() {
  const client = await global._mongoClientPromise;
  return client.db('SanskarOrganics');
}

module.exports = { getDb };
