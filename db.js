// Vercel Serverless API Backend for Attendance Tracker
// Global Shared Persistent Cloud Database Handler

const REMOTE_DB_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0a9ea66151a99';

// Default initial state fallback if remote DB is empty
let cachedStore = {
  items: [
    { id: "item-1", name: "mandi", color: "#a855f7" },
    { id: "item-2", name: "biriyani", color: "#10b981" }
  ],
  students: [
    { id: "std-1", name: "rasal" },
    { id: "std-2", name: "rasal 2" }
  ],
  distributions: {
    "std-1_item-1": true,
    "std-2_item-2": true
  },
  teamMembers: [
    { id: "team-1", name: "SalamEfx", email: "salamabdulsalam8111@gmail.com", role: "Owner Admin", isOwner: true }
  ],
  userCredentials: {},
  lastUpdated: Date.now()
};

async function fetchFromRemoteCloud() {
  try {
    const res = await fetch(REMOTE_DB_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && typeof json.data === 'object') {
        cachedStore = json.data;
        return cachedStore;
      }
    }
  } catch (err) {
    console.error('Remote DB fetch error:', err);
  }
  return cachedStore;
}

async function saveToRemoteCloud(payload) {
  cachedStore = payload;
  try {
    const res = await fetch(REMOTE_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'dist_tracker_v1',
        data: payload
      })
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || payload;
    }
  } catch (err) {
    console.error('Remote DB save error:', err);
  }
  return payload;
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. POST Request - Save global state to persistent cloud DB
  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (payload && typeof payload === 'object' && (Array.isArray(payload.items) || Array.isArray(payload.students) || payload.distributions)) {
        payload.lastUpdated = payload.lastUpdated || Date.now();
        const savedData = await saveToRemoteCloud(payload);
        return res.status(200).json({ success: true, message: 'Saved to Global Shared Cloud Database', data: savedData });
      }
      return res.status(400).json({ error: 'Invalid payload structure' });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // 2. GET Request - Load global state from persistent cloud DB
  if (req.method === 'GET') {
    const data = await fetchFromRemoteCloud();
    return res.status(200).json(data || cachedStore);
  }
};
