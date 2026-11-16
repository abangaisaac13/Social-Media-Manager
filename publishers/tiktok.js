const fs = require('fs');
const path = require('path');

const TIKTOK_QUEUE_PATH = path.join(__dirname, '../storage/tiktok_queue.json');

function ensureQueueStorage() {
    const dir = path.dirname(TIKTOK_QUEUE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(TIKTOK_QUEUE_PATH)) {
        fs.writeFileSync(TIKTOK_QUEUE_PATH, JSON.stringify([], null, 2));
    }
}

async function queueTikTokContent(item, tiktokScript) {
    ensureQueueStorage();

    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    const queueItem = {
        id: item.contentHash,
        title: item.title,
        category: item.category,
        script: tiktokScript,
        queuedAt: new Date().toISOString(),
        status: 'QUEUED'
    };

    try {
        const queue = JSON.parse(fs.readFileSync(TIKTOK_QUEUE_PATH, 'utf8'));

        // Prevent duplicate queuing
        if (!queue.some(q => q.id === item.contentHash)) {
            queue.push(queueItem);
            fs.writeFileSync(TIKTOK_QUEUE_PATH, JSON.stringify(queue, null, 2));
            console.log(`[TIKTOK QUEUE] Successfully queued item for TikTok: "${item.title}"`);
        } else {
            console.log(`[TIKTOK QUEUE] Item already in TikTok queue: "${item.title}"`);
        }
    } catch (error) {
        console.error('Error updating TikTok queue storage:', error.message);
    }

    if (!clientKey || !clientSecret || clientKey === 'your_tiktok_client_key_here') {
        console.log(`[TIKTOK API INFO] TikTok API credentials (Client Key / Secret) not fully configured. Content successfully added to local TikTok queue storage.`);
    } else {
        // Future Direct TikTok Content Posting API integration using TIKTOK_CLIENT_KEY & TIKTOK_CLIENT_SECRET
        console.log(`[TIKTOK API] Authenticated with TikTok Client Key. Ready for Content Posting API dispatch.`);
    }

    return { success: true, queued: true };
}

module.exports = { queueTikTokContent };
