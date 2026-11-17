const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

async function generateSummaryAndCaption(item) {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    let aiText = '';

    const prompt = `
Summarize the following content item into:
1. Headline
2. Key Points (3)
3. Why It Matters
4. Call To Action

Guidelines:
- Professional tone.
- No sensationalism.
- Maximum 120 words.

Content Title: ${item.title}
Content Source/Details: ${item.company || item.source || ''} - ${item.snippet || item.link || ''}
Category: ${item.category}
`.trim();

    let openai = null;
    if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here') {
        openai = new OpenAI({
            apiKey: openaiApiKey
        });
    }

    if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
        try {
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const geminiModel = genAI.getGenerativeModel({
                model: "gemini-1.5-flash"
            });
            const result = await geminiModel.generateContent(prompt);
            aiText = result.response.text().trim();
        } catch (geminiError) {
            console.log("Gemini API error, trying OpenAI fallback:", geminiError.message);

            if (!openai) {
                // Will use default template
            } else {
                try {
                    const response = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ]
                    });
                    aiText = response.choices[0].message.content.trim();
                } catch (openaiError) {
                    console.log("OpenAI API error, falling back to default template:", openaiError.message);
                }
            }
        }
    } else if (openai) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });
            aiText = response.choices[0].message.content.trim();
        } catch (openaiError) {
            console.log("OpenAI API error, falling back to default template:", openaiError.message);
        }
    }

    // Fallback template if no API keys are configured or both fail
    if (!aiText) {
        if (item.category === 'Jobs') {
            aiText = `
📌 HEADLINE: ${item.title} at ${item.company}
📍 Location: ${item.location}

Key Points:
1. Position currently open at ${item.company}.
2. Great opportunity for career growth in ${item.location}.
3. Apply promptly to secure consideration.

Why It Matters:
Securing stable employment boosts professional development and economic empowerment across the region.

Call To Action:
Apply via the link below:
${item.link}
`;
        } else {
            aiText = `
📌 HEADLINE: ${item.title}
📰 Source: ${item.source}

Key Points:
1. Important development regarding ${item.title.toLowerCase()}.
2. Key stakeholders are monitoring the situation closely.
3. Long-term impacts expected across related sectors.

Why It Matters:
Staying informed helps professionals and community members make proactive, well-rounded decisions.

Call To Action:
Read the full article here:
${item.link}
`;
        }
    }

    const infographic = `
┌────────────────────────────────────────┐
│ ${item.title.substring(0, 36).toUpperCase()}
├────────────────────────────────────────┤
│ • Professional opportunity / update    │
│ • Verified reliable source             │
│ • Actionable insights for you          │
├────────────────────────────────────────┤
│ Why It Matters: Empowerment & Growth   │
└────────────────────────────────────────┘
`.trim();

    const caption = `${aiText}\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub #CareerGrowth #News`;

    return {
        caption,
        infographic
    };
}

module.exports = { generateSummaryAndCaption };
