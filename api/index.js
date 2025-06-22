// api/index.js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './.env' });
}

const express = require('express');
const cors = require('cors');
const { initializeFirebaseAdmin } = require('./config/firebaseConfig');

initializeFirebaseAdmin();

const apiRoutes = require('./routes');
const app = express();

// build your whitelist
const allowedOrigins = [
  process.env.FRONTEND_URL,    // e.g. https://your-frontend.vercel.app
  'http://localhost:5173',
  'https://sanskar-organics-admin.vercel.app/',
];

app.use(express.json());
app.use(cors({
  origin(origin, callback) {
    // allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      // origin is whitelisted
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 204
}));

app.use('/api', apiRoutes);

app.use((req, res) => res.status(404).json({ message: 'Endpoint not found' }));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: 'Something went wrong', error: err.message });
});

module.exports = app;
