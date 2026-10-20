import { chromium } from 'playwright';
import fs from 'fs';

const serviceDetails = JSON.parse(fs.readFileSync('./src/data/serviceDetails.json', 'utf8'));
const serviceSlugs = serviceDetails.map(s => `/services/${s.slug}/`);

const CORE_URLS = [
  '/',
  '/calculator/',
  '/careers/',
  '/drivers/',
  '/fleet/',
  '/tariff/',
  '/privacy/',
  '/terms/',
  '/sitemap/',
  '/services/',
  '/services/chennai-airport-taxi/',
  '/services/outstation-cabs/',
  '/services/acting-drivers/',
  '/services/corporate/',
  '/services/tours/temple-tours/',
  ...serviceSlugs
];

async function runAudit() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const auditReport = {
    totalChecked: 0,
    cleanPages: 0,
    pagesWithIssues: [],
    findings: {
      duplicateIds: [],
      duplicateTypesInGraph: [],
      fragmentedScripts: [],
      schemaComplianceNotes: []
    }
  };

  for (const path of CORE_URLS) {
    const url = `http://localhost:4321${path}`;
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (!response || response.status() !== 200) {
        auditReport.pagesWithIssues.push({ path, issue: `HTTP Status ${response ? response.status() : 'None'}` });
        continue;
      }
      auditReport.totalChecked++;

      const scripts = await page.$$eval('script[type="application/ld+json"]', els => {
        return els.map((el, i) => {
          try {
            return { index: i, valid: true, data: JSON.parse(el.textContent || '{}'), raw: el.textContent };
          } catch (e) {
            return { index: i, valid: false, error: e.message };
          }
        });
      });

      const pageIssues = [];
      const seenIds = new Set();
      const seenTypes = new Map();

      if (scripts.length > 1) {
        auditReport.findings.fragmentedScripts.push({
          path,
          count: scripts.length,
          types: scripts.map(s => s.data?.['@type'] || (s.data?.['@graph'] ? '@graph (' + s.data['@graph'].length + ')' : 'unknown'))
        });
      }

      scripts.forEach(s => {
        if (!s.valid) {
          pageIssues.push(`Script ${s.index} JSON parse error: ${s.error}`);
          return;
        }

        const items = s.data['@graph'] ? s.data['@graph'] : [s.data];

        items.forEach(item => {
          const type = Array.isArray(item['@type']) ? item['@type'].join('/') : item['@type'];
          const id = item['@id'];

          if (id) {
            if (seenIds.has(id)) {
              pageIssues.push(`Duplicate @id found: ${id}`);
              auditReport.findings.duplicateIds.push({ path, id });
            }
            seenIds.add(id);
          }

          if (s.data['@graph']) {
            if (seenTypes.has(type)) {
              seenTypes.set(type, seenTypes.get(type) + 1);
            } else {
              seenTypes.set(type, 1);
            }
          }

          // Compliance checks
          if (type === 'JobPosting') {
            if (!item.title || !item.datePosted || !item.hiringOrganization || !item.jobLocation) {
              pageIssues.push(`JobPosting missing required fields`);
            }
          }

          if (type === 'Product') {
            if (!item.name || !item.offers && !item.aggregateRating) {
              pageIssues.push(`Product missing name, offers, or aggregateRating`);
            }
          }

          if (type === 'LocalBusiness' || type?.includes('LocalBusiness')) {
            if (!item.name || !item.address) {
              pageIssues.push(`LocalBusiness missing name or address`);
            }
          }
        });
      });

      // Check if duplicate WebPage in @graph
      if (seenTypes.get('WebPage') > 1) {
        pageIssues.push(`Duplicate WebPage in single @graph (${seenTypes.get('WebPage')} occurrences)`);
        auditReport.findings.duplicateTypesInGraph.push({ path, type: 'WebPage', count: seenTypes.get('WebPage') });
      }

      if (pageIssues.length > 0) {
        auditReport.pagesWithIssues.push({ path, issues: pageIssues });
      } else {
        auditReport.cleanPages++;
      }

    } catch (err) {
      auditReport.pagesWithIssues.push({ path, issue: err.message });
    }
  }

  await browser.close();
  console.log(JSON.stringify(auditReport, null, 2));
}

runAudit().catch(console.error);
