# Media Search - Readme

## Links

**Link to repository:**

[https://github.com/alexclaes/media-search](https://github.com/alexclaes/media-search)

**Link to deployed solution:**

[https://media-search-hazel.vercel.app/](https://media-search-hazel.vercel.app/)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Run locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 with your browser to see the result.

### API Endpoint

```
GET /api/search?q=<query>&photographer=<name>&dateStart=<YYYY-MM-DD>&dateEnd=<YYYY-MM-DD>&sortBy=<relevance|date_asc|date_desc>&page=<n>&pageSize=<n>&publicationCountries=<GER,FRA>
```

---

## High-Level Approach

The search system uses an **in-memory inverted index** built at server startup. Each searchable field (`suchtext`,
`fotografen`, `bildnummer`) is tokenized and indexed separately, enabling fast lookups by token.

**Core strategy:**

- **Inverted Index**: Maps tokens to document IDs per field, enabling O(1) lookups for exact token matches
- **IDF Scoring**: Ranks results by Inverse Document Frequency - rare terms score higher than common ones
- **Field Weights**: `suchtext` (1.0) > `fotografen` (0.5) > `bildnummer` (0.3) reflects search priority
- **Substring Matching**: Query tokens match any index token containing them (e.g., "ball" matches "Fußballfeld")
- **AND Logic**: Documents must contain ALL query terms to appear in results

---

## Assumptions

- **Dataset Size**: ~10,000 items - acceptable for in-memory processing with cold start trade-off
- **Single Server**: In-memory state assumes single-instance deployment
- **German Metadata**: Text contains German words, so tokenizer preserves umlauts (ä, ö, ü, ß) and removes German stop
  words
- **Inconsistent Dates**: Source dates are `DD.MM.YYYY` format, normalized to ISO `YYYY-MM-DD` at startup
- **Publication Restrictions**: Embedded in `suchtext` as `PUBLICATIONxINxGERxSUIxAUTxONLY` pattern - extracted via
  regex. Restrictions only apply for publication in different countries.

---

## Design Decisions

### Why IDF Scoring?

IDF (Inverse Document Frequency) naturally ranks documents with rare, specific terms higher than those with common
terms. A search for "Michael Jackson" will rank documents where "Jackson" appears rarely above documents where it's
ubiquitous.

**Formula**: `Score = Σ (IDF × fieldWeight × similarity)`

- `IDF = log(totalDocs / docsContainingTerm)`
- `similarity = queryTokenLength / matchedTokenLength` (rewards exact matches)

### Why Field Weights?

- `suchtext` is the primary search field with full descriptive text.
- `fotografen` is important for attribution searches.
- `bildnummer` is a secondary identifier.

- Weights reflect this priority.

### Why Substring vs Prefix Matching?

Substring matching is more forgiving for partial queries in a media archive context. Users searching "ball" likely
want "Fußball", "Basketball", etc. I think it is a nice feature for this demo, but it does not scale (see "Current
Limitations")

---

## Limitations and What I Would Do Next

### Current Limitations

- **Linear Substring Scan**: Every query token must scan through all indexed tokens to find substring matches, making
  this O(n) where n is the total token count. With ~50k tokens and 3 query terms, that's 150k string comparisons per
  search. This works fine for small datasets but becomes a bottleneck at scale.
- **Cold Start**: On serverless cold start, the index must be rebuilt from scratch since there's no persistent state.
  This adds some latency for 10k items on the first request. Mitigations would include Redis caching or
  pre-serialized index snapshots.
- **Memory Bound**: The entire dataset and inverted index must fit in memory. Scaling to millions of items would require
  disk-based indices or distributed search infrastructure.
- **Single Instance**: Each serverless function instance maintains its own isolated index. There's no shared state, so
  if updates happen on one instance, other instances won't see them until they rebuild.

### What I Would Do Next

- **Highlights in backend**: Currently, the UI highlights the entire word containing the match (e.g., "Fußball" for
  query "ball"). Moving highlighting to the backend would allow marking the exact substring position.
- **Pre-built Set caching for scoring**: The scoring loop creates new Sets on each iteration for field
  lookups. Pre-building these Sets once during indexing would avoid repeated allocations in the hot path.
- **German stemmer**: Stemming reduces words to their root form (e.g., "laufend" → "lauf", "Häuser" → "Haus"). Adding
  a German stemmer like Snowball would improve recall by matching inflected forms without requiring exact spelling.