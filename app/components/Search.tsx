'use client';

import {useState, useEffect} from 'react';
import {MediaItem, SearchResponse} from '@/app/types/media';
import {SortByParameter} from "@/app/types/common";

// For the sake of this demo we store all photographers hardcoded in the UI
const photographers = [
  'IMAGO / Action Pictures',
  'IMAGO / Eibner-Pressefoto',
  'IMAGO / Future Image',
  'IMAGO / NurPhoto',
  'IMAGO / Panthermedia',
  'IMAGO / Reporters',
  'IMAGO / Steinach',
  'IMAGO / Sven Simon',
  'IMAGO / United Archives International',
  'IMAGO / Westend61',
  'IMAGO / Xinhua',
  'IMAGO / ZUMA Press',
  'IMAGO / blickwinkel',
  'IMAGO / imagebroker',
  'IMAGO / teutopress',
];

// For the sake of this demo we store all publication countries are hardcoded in the UI
const PUBLICATION_COUNTRY_OPTIONS = [
  {code: 'GER', label: 'Deutschland'},
  {code: 'AUT', label: 'Österreich'},
  {code: 'SUI', label: 'Schweiz'},
  {code: 'FRA', label: 'Frankreich'},
  {code: 'BEL', label: 'Belgien'},
  {code: 'NED', label: 'Niederlande'},
  {code: 'GBR', label: 'Großbritannien'},
  {code: 'IRL', label: 'Irland'},
  {code: 'ITA', label: 'Italien'},
  {code: 'ESP', label: 'Spanien'},
  {code: 'POR', label: 'Portugal'},
  {code: 'POL', label: 'Polen'},
  {code: 'CZE', label: 'Tschechien'},
  {code: 'SWE', label: 'Schweden'},
  {code: 'NOR', label: 'Norwegen'},
  {code: 'DEN', label: 'Dänemark'},
];

const DEBOUNCE_DELAY = 300;

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("de-DE", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function highlightMatches(text: string, query: string | null): React.ReactNode {
  if (!query?.trim()) {
    return text;
  }

  // Filter terms similar to tokenizer, but allow stop word in highlights
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  if (terms.length === 0) {
    return text;
  }

  // Split text into words and whitespace, preserving both
  const tokens = text.split(/(\s+)/);

  return tokens.map((token, i) => {
    const tokenLowerCase = token.toLowerCase();
    const isMatch = terms.some(term => tokenLowerCase.includes(term));
    return isMatch ? <mark className="bg-yellow-300" key={i}>{token}</mark> : token;
  });
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [photographer, setPhotographer] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [sortBy, setSortBy] = useState<SortByParameter>('score');
  const [selectedPublicationCountries, setSelectedPublicationCountries] = useState<string[]>([]);

  // Debounced search-as-you-type
  useEffect(() => {
    // Don't search for very short queries
    if (query.trim().length < 2) {
      return
    }

    const timer = setTimeout(() => {
      setSubmittedQuery(query);
      setPage(1);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [query]);

  // Call search API when state values change (e.g. submittedQuery, filter or page)
  useEffect(() => {
    if (submittedQuery === null) {
      return;
    }

    const currentQuery = submittedQuery;

    async function performSearch() {
      setLoading(true);
      setError(null);
      window.scrollTo({top: 0, behavior: 'smooth'});

      try {
        let url = `/api/search?q=${encodeURIComponent(currentQuery)}&page=${page}&pageSize=${pageSize}`;
        if (photographer) {
          url += `&photographer=${encodeURIComponent(photographer)}`;
        }
        if (dateStart) {
          url += `&dateStart=${encodeURIComponent(dateStart)}`;
        }
        if (dateEnd) {
          url += `&dateEnd=${encodeURIComponent(dateEnd)}`;
        }
        if (sortBy !== 'score') {
          url += `&sortBy=${encodeURIComponent(sortBy)}`;
        }
        if (selectedPublicationCountries.length > 0) {
          url += `&publicationCountries=${encodeURIComponent(selectedPublicationCountries.join(','))}`;
        }
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Suche fehlgeschlagen');
        }

        const data: SearchResponse = await response.json();
        setResults(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [submittedQuery, page, pageSize, photographer, dateStart, dateEnd, sortBy, selectedPublicationCountries]);

  function handleSearch() {
    setSubmittedQuery(query);
    setPage(1);
  }

  function handlePageSizeChange(newPageSize: number) {
    setPageSize(newPageSize);
    setPage(1);
  }

  function handlePhotographerChange(newPhotographer: string) {
    setPhotographer(newPhotographer);
    setPage(1);
  }

  function handleDateChange(start: string, end: string) {
    setDateStart(start);
    setDateEnd(end);
    setPage(1);
  }

  function handleSortChange(newSort: SortByParameter) {
    setSortBy(newSort);
    setPage(1);
  }

  function handlePublicationCountryToggle(code: string) {
    setSelectedPublicationCountries(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
    setPage(1);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white dark:bg-gray-800 p-6 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
            placeholder="Suchbegriff..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          />
          <button
            type="submit"
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Suche...' : 'Suchen'}
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={photographer}
            onChange={(e) => handlePhotographerChange(e.target.value)}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          >
            <option value="">Alle Fotografen</option>
            {photographers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm">Von:</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => handleDateChange(e.target.value, dateEnd)}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Bis:</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => handleDateChange(dateStart, e.target.value)}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortByParameter)}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          >
            <option value="score">Sortieren nach Relevanz</option>
            <option value="date_desc">Neueste zuerst</option>
            <option value="date_asc">Älteste zuerst</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
          >
            <option value={20}>20 pro Seite</option>
            <option value={50}>50 pro Seite</option>
            <option value={100}>100 pro Seite</option>
          </select>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Veröffentlichung zulässig in:</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {PUBLICATION_COUNTRY_OPTIONS.map(({code, label}) => (
              <label key={code} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedPublicationCountries.includes(code)}
                  onChange={() => handlePublicationCountryToggle(code)}
                  disabled={loading}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && <p>Error: {error}</p>}

      {submittedQuery !== null && !loading && total === 0 && (
        <p className="p-4">Keine Ergebnisse gefunden.</p>
      )}

      <div className="p-4 flex-1">
        {total > 0 && (
          <p className="mb-4">
            Zeige Ergebnisse {(page - 1) * pageSize + 1} bis {Math.min(page * pageSize, total)} von insgesamt {total}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded space-y-3">
              <p className="text-sm">{highlightMatches(item.searchText, submittedQuery)}</p>

              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="font-semibold">Bildnummer</dt>
                <dd>{highlightMatches(item.id, submittedQuery)}</dd>
                <dt className="font-semibold">Fotografen</dt>
                <dd>{highlightMatches(item.photographer, submittedQuery)}</dd>
                <dt className="font-semibold">Datum</dt>
                <dd>
                  <time dateTime={item.date}>{formatDate(item.date)}</time>
                </dd>
                <dt className="font-semibold">Größe</dt>
                <dd>{item.width} x {item.height}</dd>
                <dt className="font-semibold">Score</dt>
                <dd>{item._score}</dd>
              </dl>

              {item.publicationRestrictionCountries.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Veröffentlichung beschränkt auf Länder:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.publicationRestrictionCountries
                      .map(code => PUBLICATION_COUNTRY_OPTIONS.find(c => c.code === code)?.label ?? code)
                      .map(country => (
                        <span
                          key={country}
                          className="inline-block px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded-full"
                        >
                          {country}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 p-6 flex gap-6 justify-center w-full">
          <button
            onClick={() => setPage(page - 1)}
            disabled={loading || page <= 1}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Zurück
          </button>
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            disabled={loading}
          >
            {Array.from({length: totalPages}, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                Seite {p} von {totalPages}
              </option>
            ))}
          </select>
          <button
            onClick={() => setPage(page + 1)}
            disabled={loading || page >= totalPages}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
