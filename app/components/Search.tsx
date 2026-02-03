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
    return isMatch ? <mark key={i}>{token}</mark> : token;
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
          value={photographer}
          onChange={(e) => handlePhotographerChange(e.target.value)}
          disabled={loading}
        >
          <option value="">Alle Fotografen</option>
          {photographers.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="date"
          value={dateStart}
          onChange={(e) => handleDateChange(e.target.value, dateEnd)}
          disabled={loading}
        />
        <input
          type="date"
          value={dateEnd}
          onChange={(e) => handleDateChange(dateStart, e.target.value)}
          disabled={loading}
        />
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value as SortByParameter)}
          disabled={loading}
        >
          <option value="score">Sortieren nach Relevanz</option>
          <option value="date_desc">Neueste zuerst</option>
          <option value="date_asc">Älteste zuerst</option>
        </select>
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

      <div>
        <span>Veröffentlichung zulässig in:</span>
        {PUBLICATION_COUNTRY_OPTIONS.map(({code, label}) => (
          <label key={code}>
            <input
              type="checkbox"
              checked={selectedPublicationCountries.includes(code)}
              onChange={() => handlePublicationCountryToggle(code)}
              disabled={loading}
            />
            {label}
          </label>
        ))}
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
            <p><span className="font-bold">Bildnummer:</span> {highlightMatches(item.id, submittedQuery)}</p>
            <p><span className="font-bold">Fotografen:</span> {highlightMatches(item.photographer, submittedQuery)}</p>
            <p><span className="font-bold">Datum:</span>
              <time dateTime={item.date}>{formatDate(item.date)}</time>
            </p>
            <p><span className="font-bold">Breite x Höhe:</span> {item.width}x{item.height}</p>
            <p><span className="font-bold">Suchtext:</span> {highlightMatches(item.searchText, submittedQuery)}</p>
            <p><span className="font-bold">Score:</span> {item._score}</p>
            {item.publicationRestrictionCountries.length > 0 ? (
              <>
                <p>
                  <span className="font-bold">Veröffentlichung beschränkt auf Länder:</span>
                </p>
                <ul>
                  {item.publicationRestrictionCountries
                    .map(code => PUBLICATION_COUNTRY_OPTIONS.find(c => c.code === code)?.label ?? code)
                    .map(country => <li key={country}>{country}</li>)}
                </ul>
              </>
            ) : null}
            <hr/>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="p-6 flex gap-6 justify-center w-full">
          <button
            onClick={() => setPage(page - 1)}
            disabled={loading || page <= 1}
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
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
