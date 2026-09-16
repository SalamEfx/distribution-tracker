// Vercel Serverless API Backend for Attendance Tracker
// Shared Global Cloud Database API Endpoint

const KVDB_URL = "https://kvdb.io/salamefx_tracker_9821734918237/attendance";

let globalServerStore = null;

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. POST Request - Save global state
  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (payload && typeof payload === 'object') {
        globalServerStore = payload;

        try {
          await fetch(KVDB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (kvErr) {
          console.warn('KVDB write warning:', kvErr.message);
        }

        return res.status(200).json({ success: true, message: 'Saved to Shared Cloud Database', data: globalServerStore });
      }
      return res.status(400).json({ error: 'Invalid payload structure' });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // 2. GET Request - Load global state
  if (req.method === 'GET') {
    try {
      const response = await fetch(KVDB_URL);
      if (response.ok) {
        const cloudData = await response.json();
        if (cloudData && typeof cloudData === 'object' && (Array.isArray(cloudData.items) || Array.isArray(cloudData.students))) {
          globalServerStore = cloudData;
          return res.status(200).json(cloudData);
        }
      }
    } catch (e) {
      console.warn('KVDB GET error:', e.message);
    }

    if (globalServerStore) {
      return res.status(200).json(globalServerStore);
    }

    return res.status(200).json({ items: [], students: [], distributions: {}, lastUpdated: 0 });
  }
};
