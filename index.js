const { fetchJobs } = require('./collectors/jobs');
const { fetchLocalNews } = require('./collectors/localNews');
const { fetchWorldNews } = require('./collectors/worldNews');
const { generateSummaryAndCaption } = require('./generators/captionGenerator');
const { generateTikTokScript } = require('./generators/tiktokScriptGenerator');
const { publishToFacebook } = require('./publishers/facebook');
const { queueTikTokContent } = require('./publishers/tiktok');
const fs = require('fs');
const path = require('path');

// Posting Rules limits per run / day
const LIMITS = {
    'Jobs': 2,         // Max per run
    'Local News': 2,   // Max per run
    'World News': 1    // Max per run
};

async function runWorkflow() {
    console.log('========================================');
    console.log('🚀 Starting Social Media Manager Workflow (Phase 1 & Phase 2 - TikTok Integration)');
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
    let publishedCount = 0;
    let tiktokQueuedCount = 0;

    for (const item of queue) {
        const category = item.category;
        const maxLimit = LIMITS[category] || 1;

        if (categoryCounts[category] >= maxLimit) {
            console.log(`[LIMIT] Reached limit for category "${category}". Skipping remaining.`);
            continue;
        }

        console.log(`\n⚙️ Processing [${category}]: "${item.title}"`);

        // 2. AI Summarizer & Infographic Generator
        const generated = await generateSummaryAndCaption(item);

        // 3. Publish to Facebook
        const fbResult = await publishToFacebook(item, generated);

        // 4. Generate & Queue TikTok Content (Phase 2 integration)
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
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n========================================');
    console.log('✅ Workflow Completed Successfully!');
    console.log(`📊 Summary: Published ${publishedCount} to Facebook | Queued ${tiktokQueuedCount} for TikTok.`);
    console.log('========================================');
}

runWorkflow().catch(error => {
    console.error('❌ Critical workflow error:', error);
    process.exit(1);
});
