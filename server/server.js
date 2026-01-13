const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // Load from root .env

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

// TODO: Initialize InstantDB with APP_ID
// const { init } = require('@instantdb/admin');
// const db = init({ appId: process.env.INSTANT_APP_ID });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
