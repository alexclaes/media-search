export interface MediaItem {
  id: string;
  searchText: string;
  photographer: string;
  date: string;
  height: string;
  width: string;
}

export interface SearchResponse {
  items: MediaItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
