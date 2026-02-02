'use client';

import {useState} from 'react';
import {MediaItem, SearchResponse} from '@/app/types/media';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  async function performSearch(searchPage: number, searchPageSize: number = pageSize) {
    setLoading(true);
    setError(null);

    window.scrollTo({top: 0, behavior: 'smooth'});

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${searchPage}&pageSize=${searchPageSize}`);
      if (!response.ok) throw new Error('Suche fehlgeschlagen');
      const data: SearchResponse = await response.json();
      setResults(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);


    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    setPage(1);
    performSearch(1);
  }

  function handlePageSizeChange(newPageSize: number) {
    setPageSize(newPageSize);
    performSearch(1, newPageSize);
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
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          disabled={loading}
        >
          <option value={20}>20 pro Seite</option>
          <option value={50}>50 pro Seite</option>
          <option value={100}>100 pro Seite</option>
        </select>
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Suche...' : 'Suchen'}
        </button>
      </div>

      {error && <p>Error: {error}</p>}

      {total > 0 && (
        <p>
          Zeige Ergebnisse {(page - 1) * pageSize + 1} bis {Math.min(page * pageSize, total)} von insgesamt {total}
        </p>
      )}

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

      {totalPages > 1 && (
        <div className="p-6 flex gap-6 justify-center w-full">
          <button
            onClick={() => performSearch(page - 1)}
            disabled={loading || page <= 1}
          >
            Zurück
          </button>
          <select
            value={page}
            onChange={(e) => performSearch(Number(e.target.value))}
            disabled={loading}
          >
            {Array.from({length: totalPages}, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                Seite {p} von {totalPages}
              </option>
            ))}
          </select>
          <button
            onClick={() => performSearch(page + 1)}
            disabled={loading || page >= totalPages}
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
