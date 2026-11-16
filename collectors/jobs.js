const Parser = require('rss-parser');
const crypto = require('crypto');

const parser = new Parser();

function generateHash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

async function fetchJobs() {
    const jobs = [];

    // 1. Fetch RemoteOK Jobs API
    try {
        const response = await fetch('https://remoteok.com/api');
        const data = await response.json();
        // RemoteOK returns legal info object as first element sometimes
        const jobList = Array.isArray(data) ? data.slice(1, 10) : [];

        for (const job of jobList) {
            if (job && job.position && job.company) {
                const title = job.position;
                const company = job.company;
                const location = job.location || 'Remote';
                const link = job.url || job.apply_url || 'https://remoteok.com';
                const rawString = `${title}-${company}-${link}`;

                jobs.push({
                    title,
                    company,
                    location,
                    link,
                    category: 'Jobs',
                    contentHash: generateHash(rawString),
                    publishedAt: job.date || new Date().toISOString()
                });
            }
        }
    } catch (error) {
        console.error('Error fetching RemoteOK jobs:', error.message);
    }

    // 2. Fetch We Work Remotely RSS
    try {
        const feed = await parser.parseURL('https://weworkremotely.com/remote-jobs.rss');
        for (const item of (feed.items || []).slice(0, 5)) {
            const title = item.title || 'Remote Job';
            const company = item.creator || item.author || 'Various';
            const link = item.link || 'https://weworkremotely.com';
            const rawString = `${title}-${company}-${link}`;

            jobs.push({
                title,
                company,
                location: 'Remote',
                link,
                category: 'Jobs',
                contentHash: generateHash(rawString),
                publishedAt: item.isoDate || new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error fetching We Work Remotely RSS:', error.message);
    }

    // Fallback sample job if none fetched
    if (jobs.length === 0) {
        const sample = {
            title: "IT Support Officer",
            company: "ABC Technologies",
            location: "Kumasi",
            link: "https://example.com/job/it-support",
            category: "Jobs",
            contentHash: generateHash("IT Support Officer-ABC Technologies"),
            publishedAt: new Date().toISOString()
        };
        jobs.push(sample);
    }

    return jobs;
}

module.exports = { fetchJobs };
