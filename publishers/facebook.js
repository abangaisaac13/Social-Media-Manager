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

async function publishToFacebook(item, generatedContent) {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID || 'me';

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
        const targetEndpoint = pageId === 'me' ? 'me/feed' : `${pageId}/feed`;
        const url = `https://graph.facebook.com/v18.0/${targetEndpoint}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: postMessage,
                access_token: accessToken
            })
        });

        const result = await response.json();
        if (result.error) {
            throw new Error(result.error.message);
        }

        console.log(`[SUCCESS] Published to Facebook! Post ID: ${result.id}`);
        savePublished(item, result.id);
        return { success: true, id: result.id };
    } catch (error) {
        console.error(`[ERROR] Failed to publish to Facebook:`, error.message);
        console.error(`[TIP] If posting to a Page gives permission error #200, you can set your FACEBOOK_PAGE_ID secret to 'me' to post directly to your personal profile timeline using your user token for instant testing!`);
        return { success: false, error: error.message };
    }
}

module.exports = { alreadyPublished, publishToFacebook };
