const { fetchJobs } = require('./collectors/jobs');
const { fetchLocalNews } = require('./collectors/localNews');
const { fetchWorldNews } = require('./collectors/worldNews');
const { generateSummaryAndCaption } = require('./generators/captionGenerator');
const { generateJobDigest } = require('./generators/jobDigestGenerator');
const { generateTikTokScript } = require('./generators/tiktokScriptGenerator');
const { publishToFacebook } = require('./publishers/facebook');
const { queueTikTokContent } = require('./publishers/tiktok');

// Posting Rules limits per run / day (Prioritizing Job Listings)
const LIMITS = {
    'Jobs': 3,         // Prioritized max per run
    'Local News': 1,   // Max per run
    'World News': 1    // Max per run
};

async function runWorkflow() {
    console.log('========================================');
    console.log('🔍 CONTENT GENERATION & PUBLISHING TEST');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log('========================================');

    // 1. Collect Content from sources
    console.log('\n📥 Collecting content from sources...');
    const jobs = await fetchJobs();
    const localNews = await fetchLocalNews();
    const worldNews = await fetchWorldNews();

    console.log(`- Collected ${jobs.length} jobs`);
    console.log(`- Collected ${localNews.length} local news items`);
    console.log(`- Collected ${worldNews.length} world news items`);

    // 1.5 Generate and Pin Opportunities Digest (Categorized Local Ghana & International)
    console.log('\n📌 Generating Pinned Opportunities Digest (Ghana & International)...');
    try {
        const digest = await generateJobDigest(jobs);
        const digestItem = {
            title: "Pinned Opportunities Digest: Ghana & International Jobs",
            category: "Jobs",
            contentHash: "pinned-digest-" + new Date().toISOString().split('T')[0],
            link: "https://github.com/abangaisaac13/Social-Media-Manager"
        };
        const digestGenerated = {
            caption: digest.digestText,
            infographicUrl: `https://via.placeholder.com/1024x1024/0A192F/FFFFFF?text=Verified+Jobs+Digest+Ghana+%26+Global`,
            imageBuffer: null
        };

        console.log(`- Digest compiled: ${digest.localCount} Local (Ghana) jobs, ${digest.internationalCount} International jobs.`);
        await publishToFacebook(digestItem, digestGenerated, true); // true = pin to top of page
    } catch (digestError) {
        console.error('Error generating or publishing pinned job digest:', digestError.message);
    }

    const queue = [
        ...jobs.map(item => ({ ...item, category: 'Jobs' })),
        ...localNews.map(item => ({ ...item, category: 'Local News' })),
        ...worldNews.map(item => ({ ...item, category: 'World News' }))
    ];

    const categoryCounts = { 'Jobs': 0, 'Local News': 0, 'World News': 0 };
    let generatedCount = 0;
    let publishedCount = 0;
    let tiktokQueuedCount = 0;

    for (const item of queue) {
        const category = item.category;
        const maxLimit = LIMITS[category] || 1;

        if (categoryCounts[category] >= maxLimit) {
            continue;
        }

        console.log(`\n----------------------------------------`);
        console.log(`⚙️ Processing [${category}]: "${item.title}"`);
        console.log(`🔗 Link: ${item.link}`);

        // 2. AI Summarizer & Infographic Generator Test
        console.log(`🤖 Generating AI Summary & Infographic...`);
        const generated = await generateSummaryAndCaption(item);
        generatedCount++;

        console.log(`\n--- [GENERATED CAPTION PREVIEW] ---`);
        console.log(generated.caption);
        console.log(`------------------------------------`);

        if (generated.imageBuffer) {
            console.log(`\n--- [GENERATED GEMINI INFOGRAPHIC IMAGE] ---`);
            console.log(`Successfully generated image buffer (${generated.imageBuffer.length} bytes) using Gemini free tier.`);
            console.log(`-----------------------------------------------`);
        } else if (generated.infographicUrl) {
            console.log(`\n--- [GENERATED INFOGRAPHIC IMAGE URL] ---`);
            console.log(generated.infographicUrl);
            console.log(`-----------------------------------------`);
        }

        // 3. Publish to Facebook
        const fbResult = await publishToFacebook(item, generated);

        // 4. Generate & Queue TikTok Content
        const tiktokScript = generateTikTokScript(item);
        const tiktokResult = await queueTikTokContent(item, tiktokScript);

        if (fbResult.success && !fbResult.skipped) {
            categoryCounts[category]++;
            publishedCount++;
        }

        if (tiktokResult.success) {
            tiktokQueuedCount++;
        }

        // Add small delay between items
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n========================================');
    console.log('✅ Diagnostic Test Workflow Completed!');
    console.log(`📊 Summary: Generated ${generatedCount} items | Published ${publishedCount} to Facebook | Queued ${tiktokQueuedCount} for TikTok.`);
    console.log('========================================');
}

runWorkflow().catch(error => {
    console.error('❌ Critical workflow error:', error);
    process.exit(1);
});
