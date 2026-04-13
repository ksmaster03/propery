// === Lighthouse audit runner ===
// รัน Lighthouse บน https://doa.growgenius.co.th และบันทึกผล
//
// รัน:
//   node packages/web/e2e/lighthouse-audit.mjs

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';

const TARGET_URL = process.env.LIGHTHOUSE_URL || 'https://doa.growgenius.co.th/login';

async function runLighthouse() {
  console.log(`🚀 Running Lighthouse on ${TARGET_URL}...`);

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(TARGET_URL, options);

  if (!runnerResult || !runnerResult.lhr) {
    console.error('Lighthouse failed to produce report');
    await chrome.kill();
    process.exit(1);
  }

  const { categories } = runnerResult.lhr;

  // คะแนน 0-1 → 0-100
  const scores = {
    performance: Math.round((categories.performance?.score || 0) * 100),
    accessibility: Math.round((categories.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
    seo: Math.round((categories.seo?.score || 0) * 100),
  };

  console.log(`
╔══════════════════════════════════════╗
║      Lighthouse Scores (${TARGET_URL.slice(-20).padEnd(20)})
╠══════════════════════════════════════╣
║  Performance:    ${scores.performance.toString().padStart(3)}/100 ${scoreEmoji(scores.performance)}${' '.repeat(8)}║
║  Accessibility:  ${scores.accessibility.toString().padStart(3)}/100 ${scoreEmoji(scores.accessibility)}${' '.repeat(8)}║
║  Best Practices: ${scores.bestPractices.toString().padStart(3)}/100 ${scoreEmoji(scores.bestPractices)}${' '.repeat(8)}║
║  SEO:            ${scores.seo.toString().padStart(3)}/100 ${scoreEmoji(scores.seo)}${' '.repeat(8)}║
╚══════════════════════════════════════╝
`);

  // Save full report
  fs.writeFileSync('lighthouse-report.json', JSON.stringify(runnerResult.lhr, null, 2));
  fs.writeFileSync('lighthouse-summary.json', JSON.stringify({ url: TARGET_URL, scores, timestamp: new Date().toISOString() }, null, 2));

  console.log('📝 Full report saved to lighthouse-report.json');
  console.log('📊 Summary saved to lighthouse-summary.json');

  // แสดง opportunities ที่สำคัญ
  const audits = runnerResult.lhr.audits;
  const opportunities = Object.entries(audits)
    .filter(([, a]) => a.details?.type === 'opportunity' && a.numericValue && a.numericValue > 100)
    .sort(([, a], [, b]) => (b.numericValue || 0) - (a.numericValue || 0))
    .slice(0, 5);

  if (opportunities.length > 0) {
    console.log('\n🎯 Top Opportunities:');
    opportunities.forEach(([id, audit]) => {
      console.log(`  - ${audit.title} (${audit.displayValue || audit.numericValue}ms)`);
    });
  }

  await chrome.kill();
  return scores;
}

function scoreEmoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

runLighthouse().catch((err) => {
  console.error('Lighthouse error:', err);
  process.exit(1);
});
