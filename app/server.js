const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// الكود يقرأ المفاتيح الآن بأمان من بيئة سيرفر Vercel مباشرة دون كتابتها هنا
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; 
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; 

const BASE_URL = 'https://api-sports.io';

const apiHeaders = {
  'x-rapidapi-key': RAPIDAPI_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

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

app.get('/api/livescores', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/fixtures`, { headers: apiHeaders, params: { live: 'all' } });
    res.json({ matches: response.data.response });
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب النتائج الرياضية المباشرة' });
  }
});

app.get('/api/search-video', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'الرجاء تحديد نص البحث عن الفيديو' });
  try {
    const response = await axios.get('https://googleapis.com', {
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
      res.json({ videoUrl: `https://youtube.com{videoId}` });
    } else {
      res.status(404).json({ error: 'لم يتم العثور على ملخص رسمي' });
    }
  } catch (error) {
    res.status(500).json({ error: 'فشل جلب الفيديو من يوتيوب' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 سيرفر فوتبلاي المتكامل يعمل بأمان`));
