const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const CACHE_PATH = path.join(__dirname, '../storage/cache.json');

function ensureCache() {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(CACHE_PATH)) {
        fs.writeFileSync(CACHE_PATH, JSON.stringify({}, null, 2));
    }
}

function getCachedGeneration(contentHash) {
    ensureCache();
    try {
        const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
        return cache[contentHash] || null;
    } catch (error) {
        console.error('Error reading cache:', error.message);
        return null;
    }
}

function saveCachedGeneration(contentHash, result) {
    ensureCache();
    try {
        const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
        cache[contentHash] = {
            ...result,
            cachedAt: new Date().toISOString()
        };
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    } catch (error) {
        console.error('Error saving cache:', error.message);
    }
}

async function generateSummaryAndCaption(item) {
    // Check cache first for instant performance and zero API rate limit usage
    const cached = getCachedGeneration(item.contentHash);
    if (cached) {
        console.log(`[CACHE HIT] Using cached summary & caption for: "${item.title}"`);
        return {
            caption: cached.caption,
            infographic: cached.infographic
        };
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    let aiText = '';
    const isJob = item.category === 'Jobs';

    const prompt = `
Summarize the following content item into:
1. Headline
2. Key Points (3)
3. Call To Action

Guidelines:
- Professional tone.
- No sensationalism.
- Maximum 120 words.
- Do NOT include any "Why It Matters" section.
${isJob
    ? '- For this Job Listing: The Call To Action must direct interested candidates to apply via the official link provided.'
    : '- For this News/Update: The Call To Action must strictly encourage social engagement only (e.g., inviting comments, likes, shares, or reposts). Do NOT direct users to visit external websites or links.'}

Content Title: ${item.title}
Content Source/Details: ${item.company || item.source || ''} - ${item.snippet || item.link || ''}
Category: ${item.category}
`.trim();

    if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await geminiModel.generateContent(prompt);
            aiText = result.response.text().trim();
            console.log("Successfully generated summary using Gemini 2.5 Flash.");
        } catch (geminiError) {
            console.error("Gemini API Error Details:", geminiError.message);

            // Fallback to gemini-2.0-flash
            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const fallbackResult = await fallbackModel.generateContent(prompt);
                aiText = fallbackResult.response.text().trim();
                console.log("Successfully generated summary using Gemini 2.0 Flash fallback.");
            } catch (fallbackError) {
                console.error("Gemini 2.0 Flash Fallback Error Details:", fallbackError.message);
            }
        }
    }

    // Fallback template if Gemini key not set or generation fails
    if (!aiText) {
        console.log("Using default fallback template for summary.");
        if (isJob) {
            aiText = `
📌 HEADLINE: ${item.title} at ${item.company || 'Verified Employer'}
📍 Location: ${item.location || 'Remote / Various'}

Key Points:
1. Position currently open with verified requirements.
2. Excellent opportunity for career growth and professional advancement.
3. Qualified candidates are encouraged to apply promptly.

Call To Action:
Apply via the official link below:
${item.link}
`;
        } else {
            aiText = `
📌 HEADLINE: ${item.title}
📰 Source: ${item.source || 'Trusted Source'}

Key Points:
1. Important development regarding ${item.title.toLowerCase()}.
2. Key updates and community impacts being monitored.
3. Insights for professionals and stakeholders.

Call To Action:
What are your thoughts on this? Drop a comment below, like this post, and share or repost with your network!
`;
        }
    }

    // Ensure Job listings include application link and safety disclaimer
    let finalAiText = aiText;
    if (isJob) {
        if (!finalAiText.includes(item.link)) {
            finalAiText += `\n\nApply via official link:\n${item.link}`;
        }
        if (!finalAiTest.includes('Safety Reminder')) {
            finalAiText += `\n\n⚠️ Safety Reminder: While we curate opportunities from trusted sources, please exercise caution. Never pay any money or fees to apply or secure employment.`;
        }
    }

    const infographic = `
╔════════════════════════════════════════╗
║ 🌟 ${item.title.substring(0, 38).toUpperCase()}
╠════════════════════════════════════════╣
║ • Verified Opportunity / Insight       ║
║ • Curated for Professional Growth      ║
║ • Actionable & Reliable                ║
╚════════════════════════════════════════╝
`.trim();

    const generationResult = {
        caption: `${finalAiText}\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub #CareerGrowth #News`,
        infographic
    };

    // Save to local cache file for high performance & rate limit protection
    saveCachedGeneration(item.contentHash, generationResult);

    return generationResult;
}

module.exports = { generateSummaryAndCaption };
