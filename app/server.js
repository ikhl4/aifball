const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// 1. تأمين CORS لموقعك فقط
app.use(cors({ origin: 'https://aifball.com' }));
app.use(express.json());

// 2. قراءة المفاتيح بأمان من بيئة السيرفر
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; 

// 3. تصحيح رابط API-Sports
const BASE_URL = 'https://v3.football.api-sports.io';

const apiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

// جلب ترتيب الدوري
app.get('/api/standings', async (req, res) => {
  const { league, season } = req.query;
  if (!league || !season) return res.status(400).json({ error: 'الرجاء تحديد رقم الدوري والسنة' });
  try {
    const response = await axios.get(`${BASE_URL}/standings`, { headers: apiHeaders, params: { league, season } });
    const standings = response.data.response?.[0]?.league?.standings?.[0] || [];
    res.json({ standings });
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب جدول الترتيب الحركي' });
  }
});

// جلب النتائج المباشرة
app.get('/api/livescores', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, { headers: apiHeaders, params: { live: 'all' } });
    res.json({ matches: response.data.response });
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب النتائج الرياضية المباشرة' });
  }
});

// البحث عن فيديو يوتيوب
app.get('/api/search-video', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'الرجاء تحديد نص البحث عن الفيديو' });
  try {
    // 4. تصحيح رابط يوتيوب
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} beIN SPORTS`,
        key: YOUTUBE_API_KEY,
        maxResults: 1,
        type: 'video',
        videoEmbeddable: 'true'
      }
    });
    const videoId = response.data.items?.[0]?.id?.videoId;
    if (videoId) {
      // 5. تصحيح رابط الفيديو النهائي
      res.json({ videoUrl: `https://www.youtube.com/watch?v=${videoId}` });
    } else {
      res.status(404).json({ error: 'لم يتم العثور على ملخص رسمي' });
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب الفيديو من يوتيوب' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 سيرفر فوتبلاي المتكامل يعمل بأمان على المنفذ ${PORT}`));
