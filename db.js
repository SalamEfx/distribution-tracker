// Vercel Serverless API Backend for Attendance Tracker
// Shared Global Cloud Database API Endpoint

const PANTRY_URL = "https://getpantry.cloud/apiv1/pantry/a89f949c-3d2b-4e6a-9f1c-8b7a6c5d4e3f/basket/salamefx_distribution";

let globalServerStore = {
  items: [
    { id: "item-1", name: "MANDI", color: "#a855f7" },
    { id: "item-2", name: "BIRIYANI", color: "#10b981" }
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

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. POST Request - Save global state to shared database
  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (payload && typeof payload === 'object' && (Array.isArray(payload.items) || Array.isArray(payload.students) || payload.distributions)) {
        globalServerStore = payload;

        // Persist to Pantry Cloud API asynchronously
        fetch(PANTRY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.warn('Pantry write warning:', err.message));

        return res.status(200).json({ success: true, message: 'Saved to Shared Cloud Database', data: globalServerStore });
      }
      return res.status(400).json({ error: 'Invalid payload structure' });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // 2. GET Request - Load global state from shared database
  if (req.method === 'GET') {
    try {
      const response = await fetch(PANTRY_URL);
      if (response.ok) {
        const cloudData = await response.json();
        if (cloudData && typeof cloudData === 'object' && (Array.isArray(cloudData.items) || Array.isArray(cloudData.students))) {
          if (!globalServerStore || (cloudData.lastUpdated && cloudData.lastUpdated > globalServerStore.lastUpdated)) {
            globalServerStore = cloudData;
          }
        }
      }
    } catch (e) {}

    return res.status(200).json(globalServerStore);
  }
};
