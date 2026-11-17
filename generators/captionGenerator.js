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

    // 1. Try Gemini first (Free Tier)
    if (genAI) {
        try {
            const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await geminiModel.generateContent(prompt);
            aiText = result.response.text().trim();
            console.log("Successfully generated text using Gemini AI.");
        } catch (geminiError) {
            console.error("Gemini API Error Details:", geminiError.message);
        }
    }

    // 2. Fallback to OpenAI if Gemini failed or key not set
    if (!aiText && openai) {
        try {
            console.log("Falling back to OpenAI for text generation...");
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
        console.log("Using default fallback template for text generation.");
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

    // Image Generation: Use Gemini Free Tier (Imagen 3) first, fallback to OpenAI DALL-E 3
    let infographicUrl = null;
    let imageBuffer = null;

    if (genAI) {
        try {
            console.log("Generating infographic image using Gemini Free Tier (Imagen 3)...");
            const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });
            const imageResponse = await imageModel.generateImages({
                prompt: isJob
                    ? `Professional, clean, minimalist corporate job opportunity graphic for "${item.title}" at "${item.company || 'Hiring Company'}". Modern color palette of deep navy blue, teal, and white. Clean typography highlighting key role details. Business recruitment style, high resolution, clear at a glance, no clutter.`
                    : `Professional, clean, minimalist corporate news infographic design for "${item.title}". Modern color palette of deep navy blue, white, and slate grey. Clean sans-serif typography showing key takeaways. Business presentation style, high resolution, easily understood at a glance, no clutter.`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });

            if (imageResponse && imageResponse.generatedImages && imageResponse.generatedImages[0]) {
                const base64Bytes = imageResponse.generatedImages[0].image.imageBytes;
                imageBuffer = Buffer.from(base64Bytes, 'base64');
                console.log("Successfully generated infographic image using Gemini Imagen 3.");
            }
        } catch (geminiImageError) {
            console.error("Gemini Imagen 3 Error Details:", geminiImageError.message);
        }
    }

    // Fallback image generation to OpenAI DALL-E 3 if Gemini image generation failed
    if (!imageBuffer && openai) {
        try {
            console.log("Falling back to OpenAI DALL-E 3 for image generation...");
            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: isJob
                    ? `A professional, clean, minimalist corporate job opportunity graphic for "${item.title}" at "${item.company || 'Hiring Company'}". Modern color palette of deep navy blue, teal, and white. Clean typography highlighting key role details.`
                    : `A professional, clean, minimalist corporate news infographic design for "${item.title}". Modern color palette of deep navy blue, white, and slate grey.`,
                n: 1,
                size: "1024x1024"
            });
            infographicUrl = imageResponse.data[0].url;
            console.log("Successfully generated image using OpenAI DALL-E 3.");
        } catch (dalleError) {
            console.error("DALL-E 3 Error Details:", dalleError.message);
        }
    }

    const caption = `${finalAiText}\n\n#OpportunitiesAndInsightsAfrica #DailyOpportunityHub #CareerGrowth #News`;

    return {
        caption,
        infographicUrl,
        imageBuffer
    };
}

module.exports = { generateSummaryAndCaption };
