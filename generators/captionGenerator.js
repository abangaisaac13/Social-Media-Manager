const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

async function generateSummaryAndCaption(item) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

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

    let genAI = null;
    if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
        genAI = new GoogleGenerativeAI(geminiApiKey);
    }

    let openai = null;
    if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here') {
        openai = new OpenAI({ apiKey: openaiApiKey });
    }

    // 1. Try Gemini using the latest model (gemini-2.5-flash)
    if (genAI) {
        try {
            const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await geminiModel.generateContent(prompt);
            aiText = result.response.text().trim();
            console.log("Successfully generated text using Gemini 2.5 Flash.");
        } catch (geminiError) {
            console.error("Gemini API Error Details:", geminiError.message);

            // Try fallback to gemini-2.0-flash or gemini-1.5-flash if 2.5 encounters an issue
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const fallbackResult = await fallbackModel.generateContent(prompt);
                aiText = fallbackResult.response.text().trim();
                console.log("Successfully generated text using Gemini 2.0 Flash fallback.");
            } catch (fallbackError) {
                console.error("Gemini 2.0 Flash Fallback Error Details:", fallbackError.message);
            }
        }
    }

    // 2. Fallback to OpenAI if Gemini failed
    if (!aiText && openai) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            });
            aiText = response.choices[0].message.content.trim();
        } catch (openaiError) {
            console.error("OpenAI API Error Details:", openaiError.message);
        }
    }

    // 3. Ultimate Fallback Template
    if (!aiText) {
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
        if (!finalAiText.includes('Safety Reminder')) {
            finalAiText += `\n\n⚠️ Safety Reminder: While we curate opportunities from trusted sources, please exercise caution. Never pay any money or fees to apply or secure employment.`;
        }
    }

    // Generate a clean, professional visual infographic card layout (text-based visual card)
    const infographic = `
╔════════════════════════════════════════╗
║ 🌟 ${item.title.substring(0, 38).toUpperCase()}
╠════════════════════════════════════════╣
║ • Verified Opportunity / Insight       ║
║ • Curated for Professional Growth      ║
║ • Actionable & Reliable                ║
╚════════════════════════════════════════╝
`.trim();

    const caption = `${finalAiText}\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub #CareerGrowth #News`;

    return {
        caption,
        infographic,
        infographicUrl: null,
        imageBuffer: null
    };
}

module.exports = { generateSummaryAndCaption };
