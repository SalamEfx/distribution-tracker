// Vercel Serverless API Backend for Attendance Tracker
// Direct Realtime Cloud Integration with Firebase Realtime Database

const FIREBASE_RTDB_URL = "https://attendance-tracker-live-default-rtdb.firebaseio.com/shared_attendance_tracker.json";

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. POST Request - Update Firebase Realtime Database
  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const response = await fetch(FIREBASE_RTDB_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        return res.status(200).json({ success: true, message: 'Saved to Firebase Realtime Database' });
      }
      return res.status(500).json({ error: 'Failed to write to Firebase Realtime Database' });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // 2. GET Request - Fetch global state from Firebase Realtime Database
  if (req.method === 'GET') {
    try {
      const response = await fetch(FIREBASE_RTDB_URL);
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data || { items: [], students: [], distributions: {}, lastUpdated: 0 });
      }
    } catch (e) {
      console.warn('Firebase GET error:', e.message);
    }
    return res.status(200).json({ items: [], students: [], distributions: {}, lastUpdated: 0 });
  }
};
