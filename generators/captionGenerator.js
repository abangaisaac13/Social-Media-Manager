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
        console.error('[SECURITY/CACHE] Error reading cache securely:', error.message);
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
        console.error('[SECURITY/CACHE] Error saving cache securely:', error.message);
    }
}

function sanitizeInput(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
}

function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// Generate professional job flyer or news visual using Gemini Imagen 3 REST API
async function generateGeminiVisual(item, isJob) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') return null;

    const safeTitle = sanitizeInput(item.title);
    const safeCompany = sanitizeInput(item.company || 'Verified Employer');

    const prompt = isJob
        ? `A professional, clean, minimalist corporate job advertisement flyer for "${safeTitle}" at "${safeCompany}". High-end graphic design, modern navy blue and clean white color palette, professional typography highlighting remote career opportunity, clean layout, no clutter, stunning marketing flyer designed by a professional artist.`
        : `A professional, clean, minimalist corporate news visual graphic for "${safeTitle}". Modern navy blue and slate grey color palette, high-end presentation style, clean typography, engaging editorial graphic design.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiApiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "1:1"
                    }
                })
            }
        );

        const data = await response.json();
        if (data && data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
            const base64Bytes = data.predictions[0].bytesBase64Encoded;
            console.log("[GEMINI IMAGEN] Successfully generated professional job flyer/visual image!");
            return Buffer.from(base64Bytes, 'base64');
        } else if (data.error) {
            console.log("[GEMINI IMAGEN] Notice:", data.error.message);
        }
    } catch (error) {
        console.error("[GEMINI IMAGEN] Error generating image via Gemini:", error.message);
    }
    return null;
}

async function generateSummaryAndCaption(item) {
    try {
        const safeTitle = sanitizeInput(item.title);
        const safeCompany = sanitizeInput(item.company || item.source || '');
        const safeSnippet = sanitizeInput(item.snippet || '');
        const safeLink = isValidUrl(item.link) ? item.link : '';
        const isJob = item.category === 'Jobs';

        // Check cache first for instant performance
        const cached = getCachedGeneration(item.contentHash);
        if (cached) {
            console.log(`[CACHE HIT] Using cached summary & visual for: "${safeTitle}"`);
            return {
                caption: cached.caption,
                infographicUrl: cached.infographicUrl,
                imageBuffer: cached.imageBuffer ? Buffer.from(cached.imageBuffer) : null
            };
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        let aiText = '';

        const prompt = `
Summarize the following content item into:
1. Headline
2. Key Points (3)
${isJob ? '3. Minimum Qualifications (Education, Experience, Skills)\n4.' : '3.'} Call To Action

Guidelines:
- Professional tone.
- No sensationalism.
- Maximum 140 words.
- Do NOT include any "Why It Matters" section.
${isJob
    ? '- For this Job Listing: The Call To Action must direct interested candidates (qualified Africans and global remote talent) to apply via the official link provided.'
    : '- For this News/Update: The Call To Action must strictly encourage social engagement only (e.g., inviting comments, likes, shares, or reposts). Do NOT direct users to visit external websites or links.'}

Content Title: ${safeTitle}
Content Source/Details: ${safeCompany} - ${safeSnippet}
Category: ${sanitizeInput(item.category)}
`.trim();

        if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
            try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const geminiModel = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
                const result = await geminiModel.generateContent(prompt);
                aiText = result.response.text().trim();
                console.log("Successfully generated summary using Gemini 3.8 Flash.");
            } catch (geminiError) {
                console.error("Gemini API Error Details:", geminiError.message);

                try {
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                    const fallbackResult = await fallbackModel.generateContent(prompt);
                    aiText = fallbackResult.response.text().trim();
                    console.log("Successfully generated summary using Gemini 1.5 Flash fallback.");
                } catch (fallbackError) {
                    console.error("Gemini 1.5 Flash Fallback Error Details:", fallbackError.message);
                }
            }
        }

        // Fallback template if Gemini fails
        if (!aiText) {
            console.log("Using default professional fallback template for summary.");
            if (isJob) {
                aiText = `
📌 HEADLINE: ${safeTitle} at ${safeCompany || 'Verified Employer'}
📍 Location: ${sanitizeInput(item.location || 'Remote / Africa & Worldwide')}

Key Points:
1. Position currently open with verified requirements, open to qualified professionals across Africa and worldwide.
2. Excellent opportunity for career growth and professional advancement.
3. Qualified candidates are encouraged to apply promptly.

Minimum Qualifications:
- Relevant educational background or equivalent professional experience.
- Demonstrated technical and communication skills required for the role.

Call To Action:
Apply via the official link below:
${safeLink}
`;
            } else {
                aiText = `
📌 HEADLINE: ${safeTitle}
📰 Source: ${safeCompany || 'Trusted Source'}

Key Points:
1. Important development regarding ${safeTitle.toLowerCase()}.
2. Key updates and community impacts being monitored.
3. Insights for professionals and stakeholders.

Call To Action:
What are your thoughts on this? Drop a comment below, like this post, and share or repost with your network!
`;
            }
        }

        let finalAiText = aiText;
        if (isJob) {
            if (safeLink && !finalAiText.includes(safeLink)) {
                finalAiText += `\n\nApply via official link:\n${safeLink}`;
            }
            if (!finalAiText.includes('Safety Reminder')) {
                finalAiText += `\n\n⚠️ Safety Reminder: While we curate opportunities from trusted sources, please exercise caution. Never pay any money or fees to apply or secure employment.`;
            }
        }

        // Generate professional flyer/image using Gemini Imagen 3
        const imageBuffer = await generateGeminiVisual(item, isJob);
        const infographicUrl = !imageBuffer ? `https://via.placeholder.com/1024x1024/0A192F/FFFFFF?text=${encodeURIComponent(safeTitle.substring(0, 45))}` : null;

        const generationResult = {
            caption: `${finalAiText}\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub #CareerGrowth #News`,
            infographicUrl,
            imageBuffer: imageBuffer ? imageBuffer.toString('base64') : null
        };

        saveCachedGeneration(item.contentHash, generationResult);

        return {
            caption: generationResult.caption,
            infographicUrl: generationResult.infographicUrl,
            imageBuffer
        };
    } catch (error) {
        console.error('[EXCEPTION] Professional error handling caught in generateSummaryAndCaption:', error.message);
        return {
            caption: `📌 UPDATE: ${sanitizeInput(item.title)}\n\nExplore this update today!\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub`,
            infographicUrl: `https://via.placeholder.com/1024x1024/0A192F/FFFFFF?text=Opportunities+Africa`,
            imageBuffer: null
        };
    }
}

module.exports = { generateSummaryAndCaption };
