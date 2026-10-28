const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // لحفظ المفاتيح السرية بأمان في ملف .env

const app = express();
app.use(cors()); // السماح لموقعك (Next.js) بالاتصال بالسيرفر بدون مشاكل أمنية
app.use(express.json());

// إعدادات الاتصال بـ RapidAPI - API-Football
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; // ضع مفتاحك في ملف .env
const BASE_URL = 'https://api-sports.io';

const apiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

/**
 * 1️⃣ نقطة وصول لجلب ترتيب الدوري (Standings)
 * مثال الاستدعاء من موقعك: /api/standings?league=39&season=2026
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
    
    // استخراج مصفوفة الترتيب النظيفة وتمريرها للموقع
    const standings = response.data.response[0]?.league?.standings[0] || [];
    res.json({ standings });
  } catch (error) {
    console.error('Error fetching standings:', error.message);
    res.status(500).json({ error: 'فشل جلب جدول الترتيب الحركي' });
  }
});

/**
 * 2️⃣ نقطة وصول لجلب نتائج المباريات الحية والمباشرة (Live Scores)
 * مثال الاستدعاء من موقعك: /api/livescores
 */
app.get('/api/livescores', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: apiHeaders,
      params: { live: 'all' } // جلب كافة المباريات المباشرة حول العالم حالياً
    });

    res.json({ matches: response.data.response });
  } catch (error) {
    console.error('Error fetching live scores:', error.message);
    res.status(500).json({ error: 'فشل جلب النتائج الرياضية المباشرة ثانية بثانية' });
  }
});

/**
 * 3️⃣ نقطة وصول لجلب إحصائيات مقارنة أداء اللاعبين التكتيكي
 * مثال الاستدعاء من موقعك: /api/player-compare?player1=276&player2=154&season=2026
 */
app.get('/api/player-compare', async (req, res) => {
  const { player1, player2, season } = req.query;

  if (!player1 || !player2 || !season) {
    return res.status(400).json({ error: 'الرجاء تحديد معرفات اللاعبين والسنة للمقارنة' });
  }

  try {
    // جلب بيانات اللاعب الأول واللاعب الثاني بالتوازي لسرعة الأداء في الـ Streaming
    const [res1, res2] = await Promise.all([
      axios.get(`${BASE_URL}/players`, { headers: apiHeaders, params: { id: player1, season } }),
      axios.get(`${BASE_URL}/players`, { headers: apiHeaders, params: { id: player2, season } })
    ]);

    const player1Data = res1.data.response[0] || null;
    const player2Data = res2.data.response[0] || null;

    res.json({
      player1: player1Data,
      player2: player2Data
    });
  } catch (error) {
    console.error('Error comparing players:', error.message);
    res.status(500).json({ error: 'فشل تحليل أداء ومقارنة اللاعبين تكتيكياً' });
  }
});

// تشغيل السيرفر المطور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 سيرفر بيانات فوتبلاي الآمن يعمل بنجاح على المنفذ ${PORT}`);
});
