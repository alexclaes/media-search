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

function toMediaItem(raw: RawMediaItem): MediaItem {
  return {
    id: raw.bildnummer,
    searchText: raw.suchtext,
    photographer: raw.fotografen,
    date: raw.datum,
    height: raw.hoehe,
    width: raw.breite
  };
}

// Build index at startup
export const index = buildIndex();

export function search(query: string): MediaItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return [];
  }


  // Get all docs containing the first token
  let resultSet = new Set(index.suchtext[tokens[0]] || []);

  // Intersect with remaining tokens (AND logic)
  for (let i = 1; i < tokens.length; i++) {
    const tokenDocs = new Set(index.suchtext[tokens[i]] || []);
    resultSet = new Set([...resultSet].filter(id => tokenDocs.has(id)));
  }

  // Convert to MediaItem array
  return [...resultSet].map(docId => toMediaItem(rawMedia[docId]));
}
