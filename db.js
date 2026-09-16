// Vercel Serverless API Backend for Attendance Tracker
// Connects to MySQL if configured, or uses global Cloud Storage fallback

const PANTRY_URL = "https://getpantry.cloud/apiv1/pantry/a89f949c-3d2b-4e6a-9f1c-8b7a6c5d4e3f/basket/salamefx_distribution";

let serverCache = null;

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Check if MySQL is configured in Vercel Environment Variables
  if (process.env.MYSQL_HOST && process.env.MYSQL_USER) {
    try {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'distribution_db',
        port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
        ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
      });

      await connection.execute(`
        CREATE TABLE IF NOT EXISTS distribution_data (
          id INT AUTO_INCREMENT PRIMARY KEY,
          data_key VARCHAR(50) UNIQUE NOT NULL,
          json_data LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      if (req.method === 'GET') {
        const [rows] = await connection.execute(
          `SELECT json_data FROM distribution_data WHERE data_key = 'salamefx_global' LIMIT 1`
        );
        await connection.end();
        if (rows.length > 0) {
          const data = JSON.parse(rows[0].json_data);
          serverCache = data;
          return res.status(200).json(data);
        }
      }

      if (req.method === 'POST') {
        const bodyData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        serverCache = JSON.parse(bodyData);
        await connection.execute(
          `INSERT INTO distribution_data (data_key, json_data) 
           VALUES ('salamefx_global', ?) 
           ON DUPLICATE KEY UPDATE json_data = ?`,
          [bodyData, bodyData]
        );
        await connection.end();
        return res.status(200).json({ success: true, message: 'Saved to MySQL database' });
      }
    } catch (dbErr) {
      console.warn('MySQL unavailable, using Cloud Storage API fallback:', dbErr.message);
    }
  }

  // 2. Global REST Cloud Storage Fallback (Pantry API + In-Memory Server Cache)
  try {
    if (req.method === 'GET') {
      try {
        const response = await fetch(PANTRY_URL);
        if (response.ok) {
          const data = await response.json();
          if (data && typeof data === 'object') {
            serverCache = data;
            return res.status(200).json(data);
          }
        }
      } catch (e) {
        console.warn('Pantry GET error, falling back to server memory cache:', e.message);
      }

      if (serverCache) {
        return res.status(200).json(serverCache);
      }
      return res.status(200).json(null);
    }

    if (req.method === 'POST') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      serverCache = payload;

      try {
        await fetch(PANTRY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (pantryErr) {
        console.warn('Pantry POST write warning:', pantryErr.message);
      }

      return res.status(200).json({ success: true, message: 'Saved to Global Cloud Storage' });
    }
  } catch (err) {
    console.error('API Handler error:', err);
    if (serverCache && req.method === 'GET') {
      return res.status(200).json(serverCache);
    }
    return res.status(500).json({ error: err.message });
  }
};
