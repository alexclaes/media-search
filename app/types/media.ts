// Raw media item from media.json
export interface RawMediaItem {
  suchtext: string;
  bildnummer: string;
  fotografen: string;
  datum: string;
  hoehe: string;
  breite: string;
}

// Processed media item for API responses
export interface MediaItem {
  id: string;
  searchText: string;
  photographer: string;
  date: string;
  height: string;
  width: string;
  _score: number;
}

export interface SearchResponse {
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
