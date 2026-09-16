// Vercel Serverless API Backend for Attendance Tracker
// Global Shared Server Database API Handler

let globalServerStore = {
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
      if (payload && typeof payload === 'object' && (Array.isArray(payload.items) || Array.isArray(payload.students) || payload.distributions)) {
        globalServerStore = payload;
        return res.status(200).json({ success: true, message: 'Saved to Global Server Store', data: globalServerStore });
      }
      return res.status(400).json({ error: 'Invalid payload structure' });
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // 2. GET Request - Load global state
  if (req.method === 'GET') {
    return res.status(200).json(globalServerStore || { items: [], students: [], distributions: {}, lastUpdated: 0 });
  }
};
