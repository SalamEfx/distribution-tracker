// Vercel Serverless API Backend for Attendance Tracker
// Global Real-Time Server Memory Store + Cloud Persistence

let globalServerStore = null;

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const PANTRY_URL = "https://getpantry.cloud/apiv1/pantry/a89f949c-3d2b-4e6a-9f1c-8b7a6c5d4e3f/basket/salamefx_distribution";

  // 1. POST Request - Save global state
  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (payload && typeof payload === 'object' && (Array.isArray(payload.items) || Array.isArray(payload.students) || payload.distributions)) {
        globalServerStore = payload;

        // Asynchronously persist to Pantry Cloud API
        fetch(PANTRY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('Pantry write warning:', err.message));

        return res.status(200).json({ success: true, message: 'Saved to Global Server Store' });
      }
      return res.status(400).json({ error: 'Invalid payload structure' });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // 2. GET Request - Fetch global state
  if (req.method === 'GET') {
    // Return in-memory global store if available
    if (globalServerStore && (Array.isArray(globalServerStore.items) || Array.isArray(globalServerStore.students) || globalServerStore.distributions)) {
      return res.status(200).json(globalServerStore);
    }

    // Otherwise fetch from Pantry Cloud API fallback
    try {
      const response = await fetch(PANTRY_URL);
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object' && (Array.isArray(data.items) || Array.isArray(data.students) || data.distributions)) {
          globalServerStore = data;
          return res.status(200).json(data);
        }
      }
    } catch (e) {
      console.warn('Pantry GET error:', e.message);
    }

    // Default fallback if no data stored yet
    return res.status(200).json(globalServerStore || { items: [], students: [], distributions: {}, lastUpdated: 0 });
  }
};
