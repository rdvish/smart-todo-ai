require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('./db');
const migrate = require('./migrate');

const app = express();

app.set('trust proxy', 1); // Railway sits behind a proxy; needed for rate limiting
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
  })
);
app.use(express.json());

// Auth and todo routes
app.use('/api/auth', require('./auth'));
app.use('/api/todos', require('./todos'));

// Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';


app.get('/api/health/db', async (req, res) => {
  try {
    const r = await pool.query('SELECT now()');
    res.json({ ok: true, time: r.rows[0].now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// rate limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, slow down' },
});

app.post('/api/suggest-subtasks', aiLimiter, async (req, res) => {
  const title = String((req.body || {}).title || '').trim().slice(0, 255);
  const description = String((req.body || {}).description || '').trim().slice(0, 2000);

  if (!title) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `You are a helpful task-management assistant. Given a todo task title and description, return 3 short sub-tasks separated by commas.\n\nTitle: ${title}\nDescription: ${description}`;

    const result = await model.generateContent(prompt);
    res.json({ success: true, subtasks: result.response.text() });
  } catch (error) {
    console.error(`Gemini model ${MODEL_NAME} failed:`, error.message);
    res.status(502).json({ success: false, error: 'AI service unavailable, try again' });
  }
});

const PORT = process.env.PORT || 5000;
migrate()
  .then(() => app.listen(PORT, () => console.log(`Server on ${PORT}`)))
  .catch((err) => {
    console.error('DB setup failed:', err);
    process.exit(1);
  });