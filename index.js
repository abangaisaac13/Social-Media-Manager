const { fetchJobs } = require('./collectors/jobs');
const { fetchLocalNews } = require('./collectors/localNews');
const { fetchWorldNews } = require('./collectors/worldNews');
const { generateSummaryAndCaption } = require('./generators/captionGenerator');
const { generateTikTokScript } = require('./generators/tiktokScriptGenerator');
const { publishToFacebook } = require('./publishers/facebook');
const { queueTikTokContent } = require('./publishers/tiktok');

// Posting Rules limits per run / day
const LIMITS = {
    'Jobs': 2,         // Max per run
    'Local News': 2,   // Max per run
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

        console.log(`\n--- [GENERATED INFOGRAPHIC PREVIEW] ---`);
        console.log(generated.infographic);
        console.log(`---------------------------------------`);

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
