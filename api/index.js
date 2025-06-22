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

app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : '*',
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
