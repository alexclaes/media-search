import {chromium} from '@playwright/test';

// Search terms extracted from media.json suchtext fields
const SEARCH_TERMS = [
  // Sports
  'Radsport', 'Tennis', 'Basketball', 'Formel', 'Fußball', 'Tour de France',
  'Grand Slam', 'Euroleague', 'Bundesliga', 'Wimbledon', 'Nürburgring',
  // Events
  'Premiere', 'Konzert', 'Turnier', 'Finale', 'Pressekonferenz', 'Veranstaltung',
  // Places
  'Berlin', 'Frankfurt', 'Philharmonie', 'Stadion', 'Kanzleramt',
  // Topics
  'Politik', 'Börse', 'Archiv', 'Dokumentation', 'Klimapolitik', 'Bundestag',
  // Media/Culture
  'Filmstar', 'Orchester', 'Volksmusik', 'Fernsehstudio', 'Sendung',
  // General
  'Tag', 'Abend', 'Wetter', 'Sammlung', 'Halle',
  // Photographers
  'IMAGO', 'teutopress', 'Steinach', 'Sven Simon', 'Action Pictures',
  // Multi-word combinations
  'Formel 1 Rennen', 'Tennis Turnier', 'Basketball Finale', 'Börsenhandel Frankfurt',
  'Klassisches Orchester', 'roter Teppich', 'Frankfurter Wertpapierbörse'
];

const SEARCHES = 100;

// const URL = 'http://localhost:3000';
const URL = 'https://media-search-hazel.vercel.app/';

async function main() {
  console.log(`Starting performance test: ${SEARCHES} searches\n`);

  const browser = await chromium.launch({headless: true});
  const page = await browser.newPage();

  // Handle the alert dialog when Show Analytics is clicked
  page.on('dialog', async (dialog) => {
    console.log('\n=== Analytics Results ===');
    console.log(dialog.message());
    await dialog.accept();
  });

  await page.goto(URL);
  await page.waitForSelector('input[type="text"]');

  const clientTimes: number[] = [];

  // Perform searches
  for (let i = 1; i <= SEARCHES; i++) {
    const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];

    // Clear and type new search term
    await page.fill('input[type="text"]', term);

    // Measure client-side time: from click to results rendered
    const startTime = performance.now();

    // Click search button
    await page.click('button:has-text("Suchen")');

    // Small delay to ensure loading state has started (avoids matching pre-click state)
    await page.waitForTimeout(5);

    // Wait for loading to complete (button shows "Suchen" again, not "Suche...")
    await page.waitForSelector('button:has-text("Suchen"):not(:has-text("..."))');

    const endTime = performance.now();
    clientTimes.push(endTime - startTime);

    // Progress indicator
    if (i % 20 === 0 || i === 1) {
      const avgClient = clientTimes.reduce((a, b) => a + b, 0) / clientTimes.length;
      console.log(`Progress: ${i}/${SEARCHES} (avg client time: ${avgClient.toFixed(2)}ms)`);
    }
  }

  // Report client-side metrics
  const avgClientTime = clientTimes.reduce((a, b) => a + b, 0) / clientTimes.length;
  console.log(`\nClient-side average response time: ${avgClientTime.toFixed(2)}ms`);
  console.log('(Server-side search algorithm time shown in analytics below)');

  console.log('\nAll searches complete. Clicking Show Analytics...\n');

  // Click the Show Analytics button
  await page.click('button:has-text("Show Analytics")');

  // Wait for dialog to appear and be handled
  await page.waitForTimeout(2000);

  await browser.close();
  console.log('\nPerformance test complete!');
}

main().catch(console.error);
