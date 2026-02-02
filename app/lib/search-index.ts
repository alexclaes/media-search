import {RawMediaItem, MediaItem} from '../types/media';
import {tokenize} from './tokenizer';
import mediaData from '../data/media.json';

type FieldIndex = { [token: string]: number[] };

export interface TokenMap {
  meta: { docCount: number };
  suchtext: FieldIndex;
  fotografen: FieldIndex;
  bildnummer: FieldIndex;
}

const FIELD_WEIGHTS = {
  suchtext: 1.0,
  fotografen: 0.5,
  bildnummer: 0.3
} as const;

type IndexedField = keyof typeof FIELD_WEIGHTS;

// ---------------------------------------------------------------------------------------------------------------------
// Relevant for build time (once, when building)
// ---------------------------------------------------------------------------------------------------------------------

// Type assertion for imported JSON
const rawMedia = mediaData as RawMediaItem[];

function normalizeDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('.').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.toISOString().split('T')[0];
}

function addToFieldIndex(fieldIndex: FieldIndex, tokens: string[], docId: number): void {
  for (const token of tokens) {
    if (!fieldIndex[token]) {
      fieldIndex[token] = [];
    }
    if (!fieldIndex[token].includes(docId)) {
      fieldIndex[token].push(docId);
    }
  }
}

function buildIndex(): TokenMap {
  const index: TokenMap = {
    meta: {docCount: rawMedia.length},
    suchtext: {},
    fotografen: {},
    bildnummer: {}
  };

  rawMedia.forEach((item, docId) => {
    addToFieldIndex(index.suchtext, tokenize(item.suchtext), docId);
    addToFieldIndex(index.fotografen, tokenize(item.fotografen), docId);
    addToFieldIndex(index.bildnummer, tokenize(item.bildnummer), docId);
  });

  return index;
}

function buildAllTokens() {
  const tokens = new Set<string>();
  for (const field of Object.keys(FIELD_WEIGHTS) as IndexedField[]) {
    for (const token of Object.keys(index[field])) {
      tokens.add(token);
    }
  }

  return [...tokens];
}


// Build index at startup
export const index = buildIndex();

// Build an array containing all tokens at startup (for substring matching)
const allTokens = buildAllTokens();

// Normalize dates at startup (parallel array to rawMedia)
const normalizedDates = rawMedia.map(item => normalizeDate(item.datum));

// ---------------------------------------------------------------------------------------------------------------------
// Relevant for run time (on every search request)
// ---------------------------------------------------------------------------------------------------------------------

function toMediaItem(docId: number, score: number): MediaItem {
  const raw = rawMedia[docId];
  return {
    id: raw.bildnummer,
    searchText: raw.suchtext,
    photographer: raw.fotografen,
    date: normalizedDates[docId],
    height: raw.hoehe,
    width: raw.breite,
    _score: score
  };
}

/**
 * Calculate IDF (Inverse Document Frequency) for a token in a specific field
 * IDF = log(N / df) where N = total docs, df = docs containing term
 */
function calculateIDF(field: IndexedField, token: string): number {
  const docs = index[field][token];
  if (!docs || docs.length === 0) {
    return 0;
  }
  return Math.log(index.meta.docCount / docs.length);
}

/**
 * Get all docs that contain a token in any indexed field
 */
function getDocsForTokens(tokens: string[]): Set<number> {
  const docs = new Set<number>();
  for (const token of tokens) {
    for (const field of Object.keys(FIELD_WEIGHTS) as IndexedField[]) {
      for (const docId of (index[field][token] || [])) {
        docs.add(docId);
      }
    }
  }
  return docs;
}


export function search(
  query: string,
  photographerFilter?: string,
  dateStart?: string,
  dateEnd?: string
): MediaItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }

  // Find all tokens that contain the given substring
  const matches = tokens.map(t => allTokens.filter(token => token.includes(t)));

  /*
   * Step 1: Find docs containing ALL tokens (in any field)
   */
  // Get all docs containing the first token
  let resultSet = getDocsForTokens(matches[0]);

  // Intersect with remaining tokens (AND logic)
  for (let i = 1; i < matches.length; i++) {
    const tokenDocs = getDocsForTokens(matches[i]);
    resultSet = new Set([...resultSet].filter(id => tokenDocs.has(id)));
  }

  /*
   * Step 2: Calculate IDF score
   * Multiply IDF by weight based on field containing the token
   * Multiply IDF by similarity: queryTokenLength / matchedTokenLength (1.0 = exact, <1 = partial)
   * Score = sum of (IDF * fieldWeight * similarity) for each token/field match
   */
  const scores = new Map<number, number>();

  for (const docId of resultSet) {
    let score = 0;
    for (let i = 0; i < tokens.length; i++) {
      const queryToken = tokens[i];
      const matchingTokens = matches[i];

      for (const token of matchingTokens) {
        const similarity = queryToken.length / token.length;

        for (const field of Object.keys(FIELD_WEIGHTS) as IndexedField[]) {
          const fieldDocs = index[field][token] || [];
          if (fieldDocs.includes(docId)) {
            score += calculateIDF(field, token) * FIELD_WEIGHTS[field] * similarity;
          }
        }
      }
    }
    scores.set(docId, score);
  }

  /*
   * Step 3: Sort by score descending
   */
  const results = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])

  /*
   * Step 4: Convert to data structure
   */
  let mediaItems = results.map(([docId, score]) => toMediaItem(docId, score));

  /*
   * Step 5: Apply photographer filter
   */
  if (photographerFilter) {
    mediaItems = mediaItems.filter(item => item.photographer === photographerFilter);
  }

  /*
   * Step 6: Apply date range filter
   */
  if (dateStart) {
    mediaItems = mediaItems.filter(item => item.date >= dateStart);
  }
  if (dateEnd) {
    mediaItems = mediaItems.filter(item => item.date <= dateEnd);
  }

  return mediaItems;
}

export function getPhotographers(): string[] {
  return [...new Set(rawMedia.map(item => item.fotografen))].sort();
}
