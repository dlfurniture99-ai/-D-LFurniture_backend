import type {Request, Response} from 'express';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/generate-ai', async (req: Request, res: Response) => {
  const { title, category } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'AI Key not found in server settings' });
  }

  try {
    const prompt = `Write a long, detailed, and professional blog post for a luxury furniture brand called "The Wooden Space".
    The title is: "${title}"
    The category is: "${category}"
    
    The blog should include:
    1. An engaging introduction.
    2. Detailed sections with headings (H2, H3).
    3. Practical tips for interior design or furniture care.
    4. A strong conclusion.
    5. Professional tone but engaging for homeowners.
    
    Return the response ONLY in high-quality HTML format (using <h2>, <h3>, <p>, <ul>, <li>, <strong> tags). Do not include <html> or <body> tags.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json() as any;
    const content = data.choices[0].message.content;

    return res.json({ success: true, content });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI content' });
  }
});

export default router;
