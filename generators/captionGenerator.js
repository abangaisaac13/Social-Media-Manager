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

// Enhanced security: Sanitize text input to block injection and malicious payloads
function sanitizeInput(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // remove script tags
        .replace(/<[^>]*>/g, '') // remove HTML tags
        .trim();
}

// Enhanced security: Validate URLs strictly
function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

async function generateSummaryAndCaption(item) {
    try {
        // Sanitize incoming item fields for security
        const safeTitle = sanitizeInput(item.title);
        const safeCompany = sanitizeInput(item.company || item.source || '');
        const safeSnippet = sanitizeInput(item.snippet || '');
        const safeLink = isValidUrl(item.link) ? item.link : '';
        const isJob = item.category === 'Jobs';

        // Check cache first for instant performance and zero API rate limit usage
        const cached = getCachedGeneration(item.contentHash);
        if (cached) {
            console.log(`[CACHE HIT] Using cached summary & caption for: "${safeTitle}"`);
            return {
                caption: cached.caption,
                infographicUrl: cached.infographicUrl
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
    ? '- For this Job Listing: The Call To Action must direct interested candidates to apply via the official link provided.'
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

                // Fallback to gemini-1.5-flash
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

        // Fallback template if Gemini key not set or generation fails
        if (!aiText) {
            console.log("Using default professional fallback template for summary.");
            if (isJob) {
                aiText = `
📌 HEADLINE: ${safeTitle} at ${safeCompany || 'Verified Employer'}
📍 Location: ${sanitizeInput(item.location || 'Remote / Various')}

Key Points:
1. Position currently open with verified requirements.
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

        // Ensure Job listings include application link and safety disclaimer
        let finalAiText = aiText;
        if (isJob) {
            if (safeLink && !finalAiText.includes(safeLink)) {
                finalAiText += `\n\nApply via official link:\n${safeLink}`;
            }
            if (!finalAiText.includes('Safety Reminder')) {
                finalAiText += `\n\n⚠️ Safety Reminder: While we curate opportunities from trusted sources, please exercise caution. Never pay any money or fees to apply or secure employment.`;
            }
        }

        // Guaranteed professional image graphic URL for Facebook photo publishing
        const cleanTitleForImage = safeTitle.length > 55 ? safeTitle.substring(0, 52) + '...' : safeTitle;
        const infographicUrl = `https://via.placeholder.com/1024x1024/0A192F/FFFFFF?text=${encodeURIComponent(cleanTitleForImage)}`;

        const generationResult = {
            caption: `${finalAiText}\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub #CareerGrowth #News`,
            infographicUrl
        };

        // Save to cache securely
        saveCachedGeneration(item.contentHash, generationResult);

        return generationResult;
    } catch (error) {
        console.error('[EXCEPTION] Professional error handling caught in generateSummaryAndCaption:', error.message);
        return {
            caption: `📌 UPDATE: ${sanitizeInput(item.title)}\n\nExplore this update today!\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub`,
            infographicUrl: `https://via.placeholder.com/1024x1024/0A192F/FFFFFF?text=Opportunities+Africa`
        };
    }
}

module.exports = { generateSummaryAndCaption };
