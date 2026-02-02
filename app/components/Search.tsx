'use client';

import {useState} from 'react';
import {MediaItem, SearchResponse} from '@/app/types/media';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Suche fehlgeschlagen');
      const data: SearchResponse = await response.json();
      setResults(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
          placeholder="Suchbegriff..."
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Suche...' : 'Suchen'}
        </button>
      </div>

      {error && <p>Error: {error}</p>}

      <ul>
        {results.map((item) => (
          <li key={item.id}>
            <p><span className="font-bold">Bildnummer:</span> {item.id}</p>
            <p><span className="font-bold">Fotografen:</span> {item.photographer}</p>
            <p><span className="font-bold">datum:</span> {item.date}</p>
            <p><span className="font-bold">Breite x Höhe:</span> {item.width}x{item.height}</p>
            <p><span className="font-bold">Suchtext:</span> {item.searchText}</p>
            <p><span className="font-bold">Score:</span> {item._score}</p>
            <hr/>
          </li>
        ))}
      </ul>
    </div>
  );
}
