async function generateJobDigest(jobs) {
    // Categorize jobs into Local (Ghana) and International / Global Remote
    const localJobs = jobs.filter(j => /ghana|accra|kumasi|takoradi|tamale/i.test(j.location || '') || /ghana/i.test(j.title));
    const internationalJobs = jobs.filter(j => !/ghana|accra|kumasi|takoradi|tamale/i.test(j.location || '') && !/ghana/i.test(j.title));

    let digestText = `📌 PINNED OPPORTUNITIES DIGEST: VERIFIED UNEXPIRED JOBS\n\n`;
    digestText += `Here is your curated list of active career opportunities from trusted sources, categorized for Local (Ghana) and International professionals:\n\n`;

    digestText += `🇬🇭 LOCAL OPPORTUNITIES (GHANA)\n`;
    if (localJobs.length > 0) {
        localJobs.forEach((job, index) => {
            digestText += `${index + 1}. ${job.title} at ${job.company}\n   📍 Location: ${job.location}\n   🔗 Apply: ${job.link}\n\n`;
        });
    } else {
        digestText += `• New local Ghana listings updating shortly. Stay tuned!\n\n`;
    }

    digestText += `🌍 INTERNATIONAL & GLOBAL REMOTE OPPORTUNITIES\n`;
    if (internationalJobs.length > 0) {
        internationalJobs.forEach((job, index) => {
            digestText += `${index + 1}. ${job.title} at ${job.company}\n   📍 Location: ${job.location}\n   🔗 Apply: ${job.link}\n\n`;
        });
    } else {
        digestText += `• New international remote listings updating shortly. Stay tuned!\n\n`;
    }

    digestText += `⚠️ Safety Reminder: While we curate opportunities from trusted sources, please exercise caution. Never pay any money or fees to apply or secure employment.\n\n`;
    digestText += `#DailyOpportunityHub #CareerGrowth #RemoteJobs #GhanaJobs #JobSearch`;

    return {
        digestText,
        localCount: localJobs.length,
        internationalCount: internationalJobs.length
    };
}

module.exports = { generateJobDigest };
