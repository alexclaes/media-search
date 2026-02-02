import {RawMediaItem, MediaItem} from '../types/media';
import {tokenize} from './tokenizer';
import mediaData from '../data/media.json';

export interface TokenMap {
  meta: { docCount: number };
  suchtext: { [token: string]: number[] };
}

// Type assertion for imported JSON
const rawMedia = mediaData as RawMediaItem[];

function buildIndex(): TokenMap {
  const index: TokenMap = {
    meta: {docCount: rawMedia.length},
    suchtext: {}
  };

  rawMedia.forEach((item, docId) => {
    const tokens = tokenize(item.suchtext);
    for (const token of tokens) {
      if (!index.suchtext[token]) {
        index.suchtext[token] = [];
      }
      if (!index.suchtext[token].includes(docId)) {
        index.suchtext[token].push(docId);
      }
    }
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
 * Calculate IDF (Inverse Document Frequency)
 * IDF = log(N / df) where N = total docs, df = docs containing term
 * Rare terms get higher scores
 */
function calculateIDF(token: string): number {
  const docs = index.suchtext[token];
  if (!docs || docs.length === 0) {
    return 0;
  }
  return Math.log(index.meta.docCount / docs.length);
}

// Build index at startup
export const index = buildIndex();

export function search(query: string): MediaItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }

  /*
   * Step 1: Find docs
   */
  // Get all docs containing the first token
  let resultSet = new Set(index.suchtext[tokens[0]] || []);

  // Intersect with remaining tokens (AND logic)
  for (let i = 1; i < tokens.length; i++) {
    const tokenDocs = new Set(index.suchtext[tokens[i]] || []);
    resultSet = new Set([...resultSet].filter(id => tokenDocs.has(id)));
  }

  /*
   * Step 2: Calculate IDF score for each matching doc
   */
  const idfScores = tokens.map(token => calculateIDF(token));
  const totalScore = idfScores.reduce((sum, idf) => sum + idf, 0);

  const results = [...resultSet].map(docId =>
    toMediaItem(rawMedia[docId], totalScore)
  );

  /*
   * Step 3: Sort by score descending
   */
  results.sort((a, b) => b._score - a._score);

  return results;
}
