/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Configuration
const TOTAL_ITEMS = 10000;
const RESTRICTION_RATIO = 1 / 3;

// Restriction patterns (European country combinations)
const RESTRICTIONS = [
  'PUBLICATIONxINxGERxSUIxAUTxONLY', // Germany, Switzerland, Austria
  'PUBLICATIONxINxFRAxBELxSUIxONLY', // France, Belgium, Switzerland
  'PUBLICATIONxINxGBRxIRLxONLY',     // Great Britain, Ireland
  'PUBLICATIONxINxESPxPORxONLY',     // Spain, Portugal
  'PUBLICATIONxINxITAxSUIxONLY',     // Italy, Switzerland
  'PUBLICATIONxINxNEDxBELxONLY',     // Netherlands, Belgium
  'PUBLICATIONxINxPOLxCZExONLY',     // Poland, Czech Republic
  'PUBLICATIONxINxSWExNORxDENxONLY', // Sweden, Norway, Denmark
];

// Photographer agencies
const PHOTOGRAPHERS = [
  'IMAGO / United Archives International',
  'IMAGO / teutopress',
  'IMAGO / Sven Simon',
  'IMAGO / Action Pictures',
  'IMAGO / Reporters',
  'IMAGO / Xinhua',
  'IMAGO / ZUMA Press',
  'IMAGO / Panthermedia',
  'IMAGO / Future Image',
  'IMAGO / Westend61',
  'IMAGO / imagebroker',
  'IMAGO / blickwinkel',
  'IMAGO / Eibner-Pressefoto',
  'IMAGO / Steinach',
  'IMAGO / NurPhoto',
];

// Subject templates for suchtext
const SUBJECTS = {
  sports: [
    'Fußball Bundesliga Match zwischen Bayern München und Borussia Dortmund',
    'Tennis Grand Slam Turnier Finale in Wimbledon',
    'Formel 1 Rennen auf dem Nürburgring',
    'Olympische Spiele Leichtathletik 100m Finale',
    'Handball Weltmeisterschaft Deutschland gegen Frankreich',
    'Eishockey DEL Playoff Spiel',
    'Basketball Euroleague Finale',
    'Golf European Tour Championship',
    'Boxkampf Weltmeisterschaft im Schwergewicht',
    'Radsport Tour de France Bergwertung',
  ],
  music: [
    'Konzert von internationalen Rock Stars auf der Bühne',
    'Jazz Festival in Montreux mit Live Auftritt',
    'Klassisches Orchester in der Philharmonie Berlin',
    'Pop Sängerin bei Tournee Auftakt in Hamburg',
    'Heavy Metal Festival Wacken Open Air',
    'Oper Premiere an der Wiener Staatsoper',
    'DJ Set bei elektronischem Musik Festival',
    'Country Musik Konzert in Nashville',
    'Hip Hop Künstler bei Album Release Party',
    'Volksmusik Sendung im Fernsehstudio',
  ],
  politics: [
    'Bundeskanzler bei Pressekonferenz im Kanzleramt',
    'EU Gipfel Treffen der Staats und Regierungschefs',
    'Außenminister bei diplomatischen Gesprächen',
    'Bundestagsdebatte über Klimapolitik',
    'G7 Gipfeltreffen der Weltführer',
    'Wahlkampf Rede vor Anhängern',
    'UN Generalversammlung in New York',
    'Koalitionsverhandlungen in Berlin',
    'Staatsbesuch mit militärischen Ehren',
    'Demonstration für Menschenrechte',
  ],
  nature: [
    'Sonnenuntergang über den Alpen mit Bergpanorama',
    'Wildtiere in der afrikanischen Savanne',
    'Nordsee Küste mit Leuchtturm bei Sturm',
    'Regenwald im Amazonasgebiet mit exotischen Pflanzen',
    'Polarlichter über skandinavischer Landschaft',
    'Blühende Tulpenfelder in den Niederlanden',
    'Vulkanausbruch mit Lavastrom',
    'Korallenriff mit tropischen Fischen',
    'Herbstwald mit buntem Laub',
    'Wüstenlandschaft in der Sahara',
  ],
  celebrities: [
    'Filmstar bei Premiere auf dem roten Teppich',
    'Schauspieler Interview beim Filmfestival',
    'Model bei Fashion Week Modenschau',
    'Prominente bei Charity Gala Veranstaltung',
    'TV Moderator bei Talkshow Aufzeichnung',
    'Influencer bei Social Media Event',
    'Königliche Familie bei offiziellem Anlass',
    'Comedian bei Stand Up Show',
    'Autor bei Buchvorstellung und Lesung',
    'Designer bei Atelier Besichtigung',
  ],
  business: [
    'Börsenhandel an der Frankfurter Wertpapierbörse',
    'Automobilmesse IAA mit Neuvorstellungen',
    'Startup Gründer bei Pitch Präsentation',
    'Industrieanlage Produktion in Deutschland',
    'Technologie Konferenz mit Innovation',
    'Bankenviertel Skyline bei Nacht',
    'Landwirtschaft Ernte mit modernen Maschinen',
    'Einzelhandel Shopping Center Eröffnung',
    'Logistik Zentrum mit Warenverteilung',
    'Handwerk Meister bei traditioneller Arbeit',
  ],
  historical: [
    'Historische Aufnahme aus dem Jahr',
    'Archivbild zeigt wichtiges Ereignis',
    'Dokumentation der Nachkriegszeit',
    'Zeitgenössische Fotografie aus',
    'Historisches Stadtbild von',
    'Vintage Aufnahme einer Veranstaltung',
    'Klassische Porträtaufnahme',
    'Retrospektive Bilderserie',
    'Archivmaterial aus der Sammlung',
    'Dokumentarfotografie aus',
  ],
};

// Common photo dimensions (height x width pairs)
const DIMENSIONS = [
  { hoehe: '2460', breite: '3643' },
  { hoehe: '3000', breite: '4500' },
  { hoehe: '2000', breite: '3000' },
  { hoehe: '2667', breite: '4000' },
  { hoehe: '3456', breite: '5184' },
  { hoehe: '2848', breite: '4288' },
  { hoehe: '4000', breite: '6000' },
  { hoehe: '2160', breite: '3840' },
  { hoehe: '1800', breite: '2700' },
  { hoehe: '3200', breite: '4800' },
  { hoehe: '2400', breite: '3600' },
  { hoehe: '1920', breite: '2880' },
];

// Helper functions
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function randomDate() {
  const startYear = 1950;
  const endYear = 2024;
  const year = randomInt(startYear, endYear);
  const month = randomInt(0, 11);
  const day = randomInt(1, 28); // Use 28 to avoid invalid dates
  return new Date(year, month, day);
}

function generateBildnummer(index) {
  return String(50000001 + index).padStart(10, '0');
}

function generateSuchtext(hasRestriction, restrictionIndex) {
  const categories = Object.keys(SUBJECTS);
  const category = randomElement(categories);
  let text = randomElement(SUBJECTS[category]);

  // Add some variety with additional details
  const additionalDetails = [
    '',
    ' im Stadion',
    ' während der Veranstaltung',
    ' bei schönem Wetter',
    ' im Freien',
    ' in der Halle',
    ' am Abend',
    ' am Tag',
  ];
  text += randomElement(additionalDetails);

  if (hasRestriction) {
    text += ' ' + RESTRICTIONS[restrictionIndex % RESTRICTIONS.length];
  }

  return text;
}

function generateItem(index, hasRestriction, restrictionIndex) {
  const dims = randomElement(DIMENSIONS);

  return {
    suchtext: generateSuchtext(hasRestriction, restrictionIndex),
    bildnummer: generateBildnummer(index),
    fotografen: randomElement(PHOTOGRAPHERS),
    datum: formatDate(randomDate()),
    hoehe: dims.hoehe,
    breite: dims.breite,
  };
}

function generateMediaItems() {
  console.log(`Generating ${TOTAL_ITEMS} media items...`);

  const items = [];
  let restrictionIndex = 0;

  for (let i = 0; i < TOTAL_ITEMS; i++) {
    const hasRestriction = Math.random() < RESTRICTION_RATIO;

    const item = generateItem(i, hasRestriction, restrictionIndex);
    items.push(item);

    if (hasRestriction) {
      restrictionIndex++;
    }

    if ((i + 1) % 1000 === 0) {
      console.log(`  Generated ${i + 1} items...`);
    }
  }

  console.log(`\nTotal items: ${items.length}`);

  return items;
}
function writeToFile(items) {
  const outputPath = path.join(__dirname, '..', 'app', 'data', 'media.json');

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`\nWritten to: ${outputPath}`);

  const stats = fs.statSync(outputPath);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

const items = generateMediaItems();
writeToFile(items);
console.log('\nDone!');
