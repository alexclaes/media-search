// Minimal German stop words
const STOP_WORDS = new Set([
  // Articles
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
  // Common prepositions & conjunctions
  'in', 'im', 'an', 'am', 'auf', 'und', 'oder', 'mit', 'bei',
  'zu', 'zum', 'zur', 'von', 'für', 'aus', 'nach'
]);

export function tokenize(text: string): string[] {
  if (!text) {
    return [];
  }

  return text
    .toLowerCase()
    // Remove punctuation, keep Umlauts and ß
    .replace(/[^\w\säöüß]/g, ' ')
    // Split on whitespace
    .split(/\s+/)
    // Filter out short words (1 character) and stop words
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}
