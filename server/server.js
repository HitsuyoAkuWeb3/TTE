const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' }); // Load from root .env

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const { init, tx } = require('@instantdb/admin');

// Initialize InstantDB
const APP_ID = process.env.INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;
let db = null;

if (APP_ID && ADMIN_TOKEN) {
  db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });
  console.log('InstantDB initialized with APP_ID and ADMIN_TOKEN');
} else {
  console.warn('WARNING: INSTANT_APP_ID or INSTANT_ADMIN_TOKEN missing from environment. Persistence disabled.');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), persistence: !!db });
});

// Submit/Update Session
app.post('/api/submit-test', async (req, res) => {
  console.log('POST /api/submit-test received');
  if (!db) return res.status(503).json({ error: 'Persistence layer not initialized' });

  const state = req.body;
  const userId = state.userId;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const sessionId = state.id || crypto.randomUUID();
  console.log(`Processing session: ${sessionId} for user: ${userId}`);

  try {
    await db.transact([
      tx.sessions[sessionId].update({
        ...state,
        id: sessionId,
        userId: userId,
        updatedAt: Date.now()
      })
    ]);
    console.log('Transaction Successful');
    res.json({ success: true, sessionId });
  } catch (err) {
    console.error('Transaction Failed:', err.message);
    res.status(500).json({
      error: 'Failed to persist session',
      details: err.message || 'Check server logs'
    });
  }
});

// Get Sessions
app.get('/api/get-results', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Persistence layer not initialized' });

  const userId = req.query.userId;
  if (!userId) return res.status(401).json({ error: 'User ID required for retrieval' });

  try {
    const data = await db.query({
      sessions: {
        $: {
          where: { userId: userId }
        }
      }
    });
    res.json(data);
  } catch (err) {
    console.error('Query Failed:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

const crypto = require('crypto');

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
