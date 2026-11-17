const fs = require('fs');
const path = require('path');

const STORAGE_PATH = path.join(__dirname, '../storage/published.json');

function ensureStorage() {
    const dir = path.dirname(STORAGE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_PATH)) {
        fs.writeFileSync(STORAGE_PATH, JSON.stringify([], null, 2));
    }
}

function alreadyPublished(contentHash) {
    ensureStorage();
    try {
        const data = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
        return data.some(item => item.contentHash === contentHash);
    } catch (error) {
        console.error('Error reading published storage:', error.message);
        return false;
    }
}

function savePublished(item, fbResponseId) {
    ensureStorage();
    try {
        const data = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
        data.push({
            contentHash: item.contentHash,
            title: item.title,
            category: item.category,
            publishedAt: new Date().toISOString(),
            fbResponseId
        });
        fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving to published storage:', error.message);
    }
}

async function postToFacebook(message) {
    const pageId = process.env.FACEBOOK_PAGE_ID || 'me';
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    const response = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                access_token: accessToken
            })
        }
    );

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    return data;
}

async function publishToFacebook(item, generatedContent) {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (alreadyPublished(item.contentHash)) {
        console.log(`[DUPLICATE] Skipping already published item: "${item.title}"`);
        return { success: true, skipped: true };
    }

    const postMessage = `${generatedContent.caption}\n\n[Infographic Preview]\n${generatedContent.infographic}`;

    if (!accessToken || accessToken === 'your_facebook_access_token_here') {
        console.log(`[DRY RUN] Facebook Access Token not configured. Simulating post for: "${item.title}"`);
        console.log('--- Post Content ---');
        console.log(postMessage);
        console.log('--------------------');

        savePublished(item, 'dry-run-id-' + Date.now());
        return { success: true, dryRun: true };
    }

    try {
        const data = await postToFacebook(postMessage);
        console.log(`[SUCCESS] Published to Facebook! Post ID: ${data.id}`);
        savePublished(item, data.id);
        return { success: true, id: data.id };
    } catch (error) {
        console.error(`[ERROR] Failed to publish to Facebook:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { alreadyPublished, publishToFacebook };
