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

    // Append Trust & Safety cautionary reminder specifically for job listings
    let finalAiText = aiText;
    if (isJob) {
        // Ensure application link & caution disclaimer are present
        if (!finalAiText.includes(item.link)) {
            finalAiText += `\n\nApply via official link:\n${item.link}`;
        }
        if (!finalAiText.includes('Safety Reminder')) {
            finalAiText += `\n\n⚠️ Safety Reminder: While we curate opportunities from trusted sources, please exercise caution. Never pay any money or fees to apply or secure employment.`;
        }
    }

    // Generate professional infographic image using DALL-E 3 if OpenAI key is available
    let infographicUrl = null;
    if (openai) {
        try {
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: isJob
                    ? `A professional, clean, minimalist corporate job opportunity graphic for "${item.title}" at "${item.company || 'Hiring Company'}". Modern color palette of deep navy blue, teal, and white. Clean typography highlighting key role details. Business recruitment style, high resolution, clear at a glance, no clutter, no watermarks.`
                    : `A professional, clean, minimalist corporate news infographic design for "${item.title}". Modern color palette of deep navy blue, white, and slate grey. Clean sans-serif typography showing key takeaways. Business presentation style, high resolution, easily understood at a glance, no clutter, no watermarks.`,
                n: 1,
                size: "1024x1024"
            });
            infographicUrl = imageResponse.data[0].url;
        } catch (imageError) {
            console.log("DALL-E image generation notice, proceeding with text-only caption:", imageError.message);
        }
    }

    const caption = `${finalAiText}\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub #CareerGrowth #News`;

    return {
        caption,
        infographicUrl
    };
}

module.exports = { generateSummaryAndCaption };
