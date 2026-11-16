function generateTikTokScript(item) {
    const isJob = item.category === 'Jobs';

    if (isJob) {
        return {
            slides: [
                "Slide 1: 🚨 JOB ALERT",
                `Slide 2: ${item.title} at ${item.company} (${item.location})`,
                "Slide 3: Key Requirements: Relevant qualifications, problem-solving skills, and readiness to join a dynamic team.",
                "Slide 4: Competitive salary and professional benefits package.",
                "Slide 5: Apply Now! Link in bio / description."
            ],
            durationSeconds: 25,
            caption: `🚨 Hiring Alert: ${item.title} at ${item.company} (${item.location}). Apply now! #Career #Jobs #OpportunitiesAfrica`
        };
    } else {
        return {
            slides: [
                "Slide 1: 📰 NEWS UPDATE",
                `Slide 2: ${item.title}`,
                `Slide 3: Source: ${item.source || 'Verified Source'}`,
                "Slide 4: Key Insights & What It Means For You",
                "Slide 5: Read full story at link in bio!"
            ],
            durationSeconds: 25,
            caption: `📰 News Update: ${item.title}. Stay informed with Opportunities & Insights Africa! #News #Africa #Updates`
        };
    }
}

module.exports = { generateTikTokScript };
