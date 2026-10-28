const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); // السماح لموقعك بالاتصال بالسيرفر بدون مشاكل أمنية
app.use(express.json());

// دمج مفتاح API-Football الخاص بك مباشرة داخل الكود ليعمل بدون ملف .env
const RAPIDAPI_KEY = 'c1940d93074f34c797f1321047e21e12'; 
const BASE_URL = 'https://api-sports.io';

const apiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

/**
 * 1️⃣ جلب ترتيب الدوري (Standings) لموسم 2026-2027
 */
app.get('/api/standings', async (req, res) => {
  const { league, season } = req.query;
  
  if (!league || !season) {
    return res.status(400).json({ error: 'الرجاء تحديد رقم الدوري data-league والسنة data-season' });
  }

  try {
    const response = await axios.get(`${BASE_URL}/standings`, {
      headers: apiHeaders,
      params: { league, season }
    });
    
    const standings = response.data.response?.[0]?.league?.standings?.[0] || [];
    res.json({ standings });
  } catch (error) {
    console.error('Error fetching standings:', error.message);
    res.status(500).json({ error: 'فشل جلب جدول الترتيب الحركي' });
  }
});

/**
 * 2️⃣ جلب نتائج المباريات الحية والمباشرة (Live Scores)
 */
app.get('/api/livescores', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: apiHeaders,
      params: { live: 'all' }
    });

    res.json({ matches: response.data.response });
  } catch (error) {
    console.error('Error fetching live scores:', error.message);
    res.status(500).json({ error: 'فشل جلب النتائج الرياضية المباشرة' });
  }
});

/**
 * 3️⃣ مقارنة أداء اللاعبين التكتيكي
 */
app.get('/api/player-compare', async (req, res) => {
  const { player1, player2, season } = req.query;

  if (!player1 || !player2 || !season) {
    return res.status(400).json({ error: 'الرجاء تحديد معرفات اللاعبين والسنة للمقارنة' });
  }

  try {
    const [res1, res2] = await Promise.all([
      axios.get(`${BASE_URL}/players`, { headers: apiHeaders, params: { id: player1, season } }),
      axios.get(`${BASE_URL}/players`, { headers: apiHeaders, params: { id: player2, season } })
    ]);

    res.json({
      player1: res1.data.response || null,
      player2: res2.data.response || null
    });
  } catch (error) {
    console.error('Error comparing players:', error.message);
    res.status(500).json({ error: 'فشل تحليل ومقارنة اللاعبين تكتيكياً' });
  }
});

// تشغيل السيرفر المطور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 سيرفر بيانات فوتبلاي يعمل بنجاح ومباشرة على المنفذ ${PORT}`);
});
