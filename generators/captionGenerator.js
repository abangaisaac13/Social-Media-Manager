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
3. Call To Action

Guidelines:
- Professional tone.
- No sensationalism.
- Maximum 120 words.
- Do NOT include any "Why It Matters" section.

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

    // Fallback template if no API keys are configured or both fail (Without "Why It Matters")
    if (!aiText) {
        if (item.category === 'Jobs') {
            aiText = `
📌 HEADLINE: ${item.title} at ${item.company}
📍 Location: ${item.location}

Key Points:
1. Position currently open at ${item.company}.
2. Great opportunity for career growth in ${item.location}.
3. Apply promptly to secure consideration.

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

Call To Action:
Read the full article here:
${item.link}
`;
        }
    }

    // Generate professional infographic image using DALL-E 3 if OpenAI key is available
    let infographicUrl = null;
    if (openai) {
        try {
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: `A professional, clean, minimalist corporate infographic design for a social media post with the bold title "${item.title}". Modern color palette of deep navy blue, white, and slate grey. Clean sans-serif typography showing 3 key takeaway bullet points. Business presentation style, high resolution, easily understood at a glance, no clutter, no watermarks.`,
                n: 1,
                size: "1024x1024"
            });
            infographicUrl = imageResponse.data[0].url;
        } catch (imageError) {
            console.log("DALL-E image generation notice, proceeding with text-only caption:", imageError.message);
        }
    }

    const caption = `${aiText}\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub #CareerGrowth #News`;

    return {
        caption,
        infographicUrl
    };
}

module.exports = { generateSummaryAndCaption };
