/**
 * Automated Social Media Manager & AI Content Publisher
 */
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateSocialContent(topic, rawText) {
  const prompt = `
You are a professional social media editor and content strategist.
Analyze the following source material about "${topic}" and generate a JSON response with:
1. "headline": A punchy, clean, professional hook (max 80 chars).
2. "bullets": An array of 3 crisp, insightful summary bullet points.
3. "category": Category tag (e.g., #CAREERS, #TECH_TRENDS, #BUSINESS).
4. "cta": A professional call-to-action or monetization affiliate link CTA.

Source Material:
"""${rawText}"""
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.4
    }
  });

  return JSON.parse(response.text());
}

async function generateInfographicCard(contentData) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          width: 1080px;
          height: 1080px;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          color: #FFFFFF;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 80px;
          box-sizing: border-box;
          margin: 0;
        }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .tag { background: #38BDF8; color: #0F172A; font-weight: bold; padding: 10px 20px; border-radius: 30px; font-size: 20px; }
        .brand { font-size: 24px; color: #94A3B8; font-weight: 600; }
        .content { margin-top: 40px; }
        h1 { font-size: 56px; line-height: 1.2; margin-bottom: 40px; color: #F8FAFC; }
        .bullet { font-size: 32px; line-height: 1.5; margin-bottom: 24px; color: #CBD5E1; display: flex; align-items: center; }
        .bullet::before { content: "▪"; color: #38BDF8; font-size: 50px; margin-right: 20px; }
        .footer { font-size: 24px; color: #38BDF8; border-top: 2px solid #334155; padding-top: 30px; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="tag">${contentData.category}</div>
        <div class="brand">@SocialManager</div>
      </div>
      <div class="content">
        <h1>${contentData.headline}</h1>
        ${contentData.bullets.map(b => `<div class="bullet">${b}</div>`).join('')}
      </div>
      <div class="footer">
        <span>Curated Daily Insights</span>
        <span>Swipe / Read More ➔</span>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  const imageBuffer = await page.screenshot({ type: 'png' });
  await browser.close();
  return imageBuffer;
}

app.post('/api/publish-post', async (req, res) => {
  try {
    const { topic, rawText } = req.body;
    const content = await generateSocialContent(topic, rawText);
    const imageBuffer = await generateInfographicCard(content);

    console.log("Generated Post:", content);
    res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Social Media Manager running on port ${PORT}`));
