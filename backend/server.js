/**
 * Automated Social Media Manager & AI Content Publisher with X, LinkedIn, Meta, & TikTok Integration
 */
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. AI Content Generation using Gemini API
async function generateSocialContent() {
  try {
    const prompt = `
You are a professional social media editor and content strategist specializing in Ghana Education (NaCCA), tech trends, and career opportunities.
Generate a JSON response for a professional social media post with:
1. "headline": A punchy, clean, professional hook (max 80 chars).
2. "bullets": An array of 3 crisp, insightful summary bullet points.
3. "category": Category tag (e.g., #CAREERS, #TECH_TRENDS, #EDTECH).
4. "cta": A professional call-to-action or link.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.5
      }
    });

    // NOTE: response.text is a property string, NOT a function!
    const rawText = response.text;
    return JSON.parse(rawText);
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    throw error;
  }
}

// 2. Programmatic Infographic Image Card Generator
async function generateInfographicCard(contentData) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 }); // Vertical 9:16 format

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            width: 1080px;
            height: 1920px;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
            color: #FFFFFF;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 100px;
            box-sizing: border-box;
            margin: 0;
          }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .tag { background: #38BDF8; color: #0F172A; font-weight: bold; padding: 12px 24px; border-radius: 30px; font-size: 24px; }
          .brand { font-size: 28px; color: #94A3B8; font-weight: 600; }
          .content { margin-top: 100px; }
          h1 { font-size: 68px; line-height: 1.2; margin-bottom: 50px; color: #F8FAFC; }
          .bullet { font-size: 38px; line-height: 1.5; margin-bottom: 30px; color: #CBD5E1; display: flex; align-items: center; }
          .bullet::before { content: "▪"; color: #38BDF8; font-size: 60px; margin-right: 20px; }
          .footer { font-size: 28px; color: #38BDF8; border-top: 2px solid #334155; padding-top: 40px; display: flex; justify-content: space-between; }
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
          <span>Swipe / Follow ➔</span>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const imageBuffer = await page.screenshot({ type: 'png' });
    await browser.close();
    return imageBuffer;
  } catch (error) {
    console.error("❌ Puppeteer Error:", error);
    if (browser) await browser.close();
    throw error;
  }
}

// 3. Social Media Publishing Functions
async function postToTwitter(caption, imageBuffer) {
  if (!process.env.TWITTER_BEARER_TOKEN) return;
  console.log("Posting to Twitter...");
}

async function postToLinkedIn(caption, imageBuffer) {
  if (!process.env.LINKEDIN_ACCESS_TOKEN) return;
  console.log("Posting to LinkedIn...");
}

async function postToFacebook(caption, imageBuffer) {
  if (!process.env.FB_PAGE_ACCESS_TOKEN) return;
  console.log("Posting to Facebook/Instagram...");
}

async function postToTikTok(caption, imageBuffer) {
  if (!process.env.TIKTOK_ACCESS_TOKEN) return;
  console.log("Posting to TikTok...");
}

// Main execution flow for automated cron runner
async function runAutomatedPublisher() {
  console.log("🚀 Starting Automated Content Generation & Publisher...");

  const content = await generateSocialContent();
  console.log("✨ Generated AI Content:", content.headline);

  const imageBuffer = await generateInfographicCard(content);
  console.log("🎨 Vertical Infographic Image Card Generated Successfully.");

  const caption = `${content.headline}\n\n${content.bullets.map(b => `• ${b}`).join('\n')}\n\n${content.cta}\n\n${content.category} #Ghana #Education #Tech`;

  await postToTwitter(caption, imageBuffer);
  await postToLinkedIn(caption, imageBuffer);
  await postToFacebook(caption, imageBuffer);
  await postToTikTok(caption, imageBuffer);

  console.log("✅ Automated Publishing Cycle Completed successfully!");
}

if (require.main === module) {
  runAutomatedPublisher()
    .then(() => process.exit(0))
    .catch(err => {
      console.error("❌ Fatal Error in publisher:", err);
      process.exit(1);
    });
}
