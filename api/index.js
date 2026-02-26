const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'db', // Menggunakan 'db' sesuai nama service di docker-compose
  database: process.env.DB_NAME || 'taichan_db',
  password: process.env.DB_PASS || 'password',
  port: 5432,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Helper to fetch menus
async function getMenus() {
  try {
    const query = 'SELECT * FROM menus WHERE tersedia = true LIMIT 10';
    const res = await pool.query(query);
    return res.rows;
  } catch (error) {
    console.error('Database Query Error:', error.message);
    return [];
  }
}

// System Prompt
const SYSTEM_PROMPT = `
Kamu adalah AI Customer Service untuk restoran Sate Taichan.

ATURAN WAJIB:
1. Hanya jawab berdasarkan data menu yang diberikan dalam konteks.
2. Jangan pernah mengarang menu yang tidak ada dalam konteks.
3. Jika informasi tidak tersedia, jawab: "Maaf, informasi tersebut tidak tersedia."
4. Jangan menjawab di luar topik menu, produk, harga, protein, level pedas, atau rekomendasi makanan.
5. Jawaban harus singkat, jelas, dan ramah.
6. Gunakan Bahasa Indonesia santai dan profesional.
7. Output HARUS dalam format JSON valid.

FORMAT OUTPUT WAJIB:
{
  "jawaban": "...",
  "menu_direkomendasikan": "...",
  "protein": "...",
  "harga": "...",
  "level_pedas": "...",
  "catatan": "..."
}
`;

// Chat Endpoint
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Fetch Data
    const menus = await getMenus();
    if (menus.length === 0) {
        return res.status(500).json({ error: 'Database menu kosong. Silakan jalankan init.sql' });
    }

    const menuListContext = menus.map(m => 
      `- ${m.nama} (Harga: ${m.harga}, Pedas: ${m.level_pedas_min}-${m.level_pedas_max}, Favorit: ${m.favorit ? 'Ya' : 'Tidak'})`
    ).join('\n');

    // 2. Construct Prompt
    const userPrompt = `
DATA MENU RESTORAN:
${menuListContext}

PERTANYAAN CUSTOMER:
"${message}"

INSTRUKSI:
- Analisa pertanyaan berdasarkan DATA MENU RESTORAN.
- Jika customer bingung, rekomendasikan menu favorit.
- Jawab sesuai FORMAT OUTPUT WAJIB JSON.
`;

    // 3. Call AI with validations/retry
    let aiResponse = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts && !aiResponse) {
      attempts++;
      try {
        // PERBAIKAN: Menggunakan endpoint /api/generate dengan prompt yang digabung
        const response = await axios.post(`http://${process.env.AI_HOST || 'ai'}:11434/api/generate`, {
          model: 'mistral',
          prompt: `${SYSTEM_PROMPT}\n\n${userPrompt}`, // Digabung agar lebih stabil di berbagai versi Ollama
          format: 'json',
          stream: false
        });
        
        const jsonResponse = response.data.response;
        let parsed = typeof jsonResponse === 'string' ? JSON.parse(jsonResponse) : jsonResponse;
        
        if (parsed && (parsed.jawaban || parsed.menu_direkomendasikan)) {
            aiResponse = parsed;
        }
      } catch (error) {
        console.error(`Attempt ${attempts} failed:`, error.message);
      }
    }

    if (!aiResponse) {
      return res.status(500).json({ 
        jawaban: "Maaf, kakak. Taichan AI lagi istirahat sebentar. Coba tanya lagi ya!",
        error: 'Failed to get valid response from AI' 
      });
    }

    res.json(aiResponse);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Menus Endpoint (for Frontend)
app.get('/menus', async (req, res) => {
  try {
    const menus = await getMenus();
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});