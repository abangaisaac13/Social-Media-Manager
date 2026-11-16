const Parser = require('rss-parser');
const crypto = require('crypto');

const parser = new Parser();

function generateHash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

async function fetchLocalNews() {
    const newsItems = [];

    // Trusted local RSS feeds (MyJoyOnline / Citi News / GNA equivalents)
    const feeds = [
        { name: 'MyJoyOnline', url: 'https://www.myjoyonline.com/feed/' },
        { name: 'GNA', url: 'https://gna.org.gh/feed/' }
    ];

    for (const source of feeds) {
        try {
            const feed = await parser.parseURL(source.url);
            for (const item of (feed.items || []).slice(0, 3)) {
                const title = item.title || 'Local News Update';
                const link = item.link || source.url;
                const snippet = item.contentSnippet || item.content || '';
                const rawString = `${title}-${link}`;

                newsItems.push({
                    title,
                    source: source.name,
                    link,
                    snippet,
                    category: 'Local News',
                    contentHash: generateHash(rawString),
                    publishedAt: item.isoDate || new Date().toISOString()
                });
            }
        } catch (error) {
            console.error(`Error fetching local news from ${source.name}:`, error.message);
        }
    }

    // Fallback sample local news if fetch fails
    if (newsItems.length === 0) {
        newsItems.push({
            title: "Ghana Launches New Digital Skills Initiative for Youth",
            source: "Graphic Online",
            link: "https://example.com/news/digital-skills",
            snippet: "Government partners with tech leaders to train 100,000 youth in digital literacy and software development.",
            category: "Local News",
            contentHash: generateHash("Ghana Launches New Digital Skills Initiative for Youth"),
            publishedAt: new Date().toISOString()
        });
    }

    return newsItems;
}

module.exports = { fetchLocalNews };
