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

async function getPageAccessToken(accessToken, pageId) {
    try {
        console.log(`[FACEBOOK] Resolving Page Access Token for Page ID: ${pageId}...`);
        const response = await fetch(`https://graph.facebook.com/v27.0/me/accounts?access_token=${accessToken}`);
        const data = await response.json();

        if (data.error) {
            console.log(`[FACEBOOK] Notice while resolving page token: ${data.error.message}`);
            return accessToken;
        }

        if (data && data.data) {
            const matchedPage = data.data.find(p => p.id === pageId);
            if (matchedPage && matchedPage.access_token) {
                console.log(`[FACEBOOK] Successfully resolved Page Access Token for: "${matchedPage.name}" (${matchedPage.id})`);
                return matchedPage.access_token;
            } else {
                console.log(`[FACEBOOK] Page ID ${pageId} not found in user/system user accounts list. Using provided token.`);
            }
        }
    } catch (error) {
        console.log("[FACEBOOK] Error auto-fetching page access token:", error.message);
    }
    return accessToken;
}

async function postToFacebook(message, imageUrl, imageBuffer, isPinned = false) {
    const pageId = process.env.FACEBOOK_PAGE_ID || 'me';
    let accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    // Automatically resolve Page Access Token from User or System User token if needed
    if (pageId !== 'me' && accessToken) {
        accessToken = await getPageAccessToken(accessToken, pageId);
    }

    const endpoint = (imageUrl || imageBuffer)
        ? `https://graph.facebook.com/v27.0/${pageId}/photos`
        : `https://graph.facebook.com/v27.0/${pageId}/feed`;

    let response;
    if (imageBuffer) {
        const formData = new FormData();
        formData.append('access_token', accessToken);
        formData.append('caption', message);
        formData.append('source', new Blob([imageBuffer], { type: 'image/jpeg' }), 'infographic.jpg');

        response = await fetch(endpoint, {
            method: "POST",
            body: formData
        });
    } else if (imageUrl) {
        response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: imageUrl,
                caption: message,
                access_token: accessToken
            })
        });
    } else {
        response = await fetch(
            endpoint,
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
    }

    const data = await response.json();

    if (data.error) {
        console.error('Facebook API Error Details:', JSON.stringify(data.error, null, 2));
        throw new Error(data.error.message);
    }

    const postId = data.id || data.post_id;

    // Pin post to top of page if requested
    if (isPinned && postId) {
        try {
            console.log(`[FACEBOOK] Pinning post ID ${postId} to the top of the page...`);
            const pinResponse = await fetch(`https://graph.facebook.com/v27.0/${postId}?is_pinned=true&access_token=${accessToken}`, {
                method: "POST"
            });
            const pinData = await pinResponse.json();
            if (pinData.success || pinData.success === undefined) {
                console.log(`[FACEBOOK] Successfully pinned post ${postId} to the top of the Facebook page!`);
            } else {
                console.log(`[FACEBOOK] Notice while pinning post:`, pinData);
            }
        } catch (pinErr) {
            console.log(`[FACEBOOK] Could not pin post:`, pinErr.message);
        }
    }

    return data;
}

async function publishToFacebook(item, generatedContent, isPinned = false) {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!isPinned && alreadyPublished(item.contentHash)) {
        console.log(`[DUPLICATE] Skipping already published item: "${item.title}"`);
        return { success: true, skipped: true };
    }

    const postMessage = generatedContent.caption;

    if (!accessToken || accessToken === 'your_facebook_access_token_here') {
        console.log(`[DRY RUN] Facebook Access Token not configured. Simulating post for: "${item.title}"`);
        console.log('--- Post Content ---');
        console.log(postMessage);
        if (generatedContent.imageBuffer) {
            console.log(`🖼️ Infographic Image Buffer generated successfully (${generatedContent.imageBuffer.length} bytes).`);
        } else if (generatedContent.infographicUrl) {
            console.log(`🖼️ Infographic Image URL: ${generatedContent.infographicUrl}`);
        }
        if (isPinned) {
            console.log(`📌 [PINNED POST] This post will be pinned to the top of the page.`);
        }
        console.log('--------------------');

        savePublished(item, 'dry-run-id-' + Date.now());
        return { success: true, dryRun: true };
    }

    try {
        const data = await postToFacebook(postMessage, generatedContent.infographicUrl, generatedContent.imageBuffer, isPinned);
        const postId = data.id || data.post_id;
        console.log(`[SUCCESS] Published to Facebook! Post ID: ${postId} ${isPinned ? '(PINNED TO TOP)' : ''}`);
        savePublished(item, postId);
        return { success: true, id: postId };
    } catch (error) {
        console.error(`[ERROR] Failed to publish to Facebook:`, error.message);
        return { success: false, error: error.message };
    }
}

module.exports = { alreadyPublished, publishToFacebook };
