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

// Type assertion for imported JSON
const rawMedia = mediaData as RawMediaItem[];

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

function toMediaItem(raw: RawMediaItem, score: number): MediaItem {
  return {
    id: raw.bildnummer,
    searchText: raw.suchtext,
    photographer: raw.fotografen,
    date: raw.datum,
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
 * Get all doc IDs that contain a token in any indexed field
 */
function getDocsForToken(token: string): Set<number> {
  const docs = new Set<number>();
  for (const field of Object.keys(FIELD_WEIGHTS) as IndexedField[]) {
    const fieldDocs = index[field][token] || [];
    for (const docId of fieldDocs) {
      docs.add(docId);
    }
  }
  return docs;
}

// Build index at startup
export const index = buildIndex();

export function search(query: string): MediaItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }

  /*
   * Step 1: Find docs containing ALL tokens (in any field)
   */
  // Get all docs containing the first token
  let resultSet = getDocsForToken(tokens[0]);

  // Intersect with remaining tokens (AND logic)
  for (let i = 1; i < tokens.length; i++) {
    const tokenDocs = getDocsForToken(tokens[i]);
    resultSet = new Set([...resultSet].filter(id => tokenDocs.has(id)));
  }

  /*
   * Step 2: Calculate IDF score for each matching doc
   * Multiply IDF by weight based on field containing the token
   * Score = sum of (IDF * fieldWeight) for each token/field match
   */
  const scores = new Map<number, number>();

  for (const docId of resultSet) {
    let score = 0;
    for (const token of tokens) {
      for (const field of Object.keys(FIELD_WEIGHTS) as IndexedField[]) {
        const fieldDocs = index[field][token] || [];
        if (fieldDocs.includes(docId)) {
          score += calculateIDF(field, token) * FIELD_WEIGHTS[field];
        }
      }
    }
    scores.set(docId, score);
  }

  /*
   * Step 3: Sort by score descending (and convert to MediaItem)
   */
  const results = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([docId, score]) => toMediaItem(rawMedia[docId], score));

  return results;
}
