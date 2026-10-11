const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/suggest-subtasks', async (req, res) => {
  const { title, description } = req.body;

  try {
    // Use the fast and lightweight gemini-1.5-flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

    const prompt = `You are a helpful task-management assistant. Given a todo task title and description, return 3 short sub-tasks separated by commas.\n\nTitle: ${title}\nDescription: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      subtasks: text,
    });
  } catch (error) {
    /*console.error('Error with Gemini AI:', error);
    res.status(500).json({ success: false, error: error.message });*/
    console.warn(`Model ${modelName} failed or busy, trying next...`, error.message);
      lastError = error;
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));