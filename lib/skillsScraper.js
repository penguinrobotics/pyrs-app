const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape skills attempt data from VEX Tournament Manager
 * @param {string} baseUrl - Base URL for VEX TM server
 * @returns {Promise<Array>} Array of team skills data
 * @throws {Error} If scraping fails
 */
async function scrapeSkillsData(baseUrl) {
  const skillsUrl = `${baseUrl}/skills`;

  console.log('[Skills Scraper] Fetching from:', skillsUrl);

  try {
    const response = await axios.get(skillsUrl, {
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'PYRS-Queue-System/1.0'
      }
    });

    const $ = cheerio.load(response.data);
    const teamsData = [];

    // Find the skills table: table.table-striped.table-bordered
    $('table.table-striped.table-bordered.table-condensed.table-centered tbody tr').each((index, element) => {
      const $tds = $(element).find('td');

      if ($tds.length >= 3) {
        const number = $tds.eq(0).text().trim();
        const autonomous = parseInt($tds.eq(1).text().trim(), 10);
        const driving = parseInt($tds.eq(2).text().trim(), 10);

        // Validate parsed data
        if (number && !isNaN(autonomous) && !isNaN(driving)) {
          teamsData.push({
            number,
            autonomous,
            driving
          });
        } else {
          console.warn('[Skills Scraper] Invalid data in row:', { number, autonomous, driving });
        }
      }
    });

    console.log('[Skills Scraper] Successfully scraped', teamsData.length, 'teams');
    return teamsData;

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('[Skills Scraper] Connection refused - VEX TM server may be down');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('[Skills Scraper] Request timeout');
    } else if (error.response) {
      console.error('[Skills Scraper] HTTP error:', error.response.status);
    } else {
      console.error('[Skills Scraper] Error:', error.message);
    }
    throw error;
  }
}

module.exports = {
  scrapeSkillsData
};
