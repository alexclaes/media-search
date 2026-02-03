import {NextRequest, NextResponse} from 'next/server';
import {SearchResponse} from '@/app/types/media';
import {search} from '@/app/lib/search-index';
import {SortByParameter} from "@/app/types/common";
import {recordSearch} from '@/app/lib/analytics';

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  const startTime = performance.now();
  const query = request.nextUrl.searchParams.get('q') || '';
  const photographer = request.nextUrl.searchParams.get('photographer') || '';
  const dateStart = request.nextUrl.searchParams.get('dateStart') || '';
  const dateEnd = request.nextUrl.searchParams.get('dateEnd') || '';
  const sortBy = request.nextUrl.searchParams.get('sortBy') as SortByParameter | null;
  const publicationCountriesParam = request.nextUrl.searchParams.get('publicationCountries');
  const publicationCountries = publicationCountriesParam ? publicationCountriesParam.split(',').filter(Boolean) : undefined;
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('pageSize') || '20')));

  const allResults = search(
    query,
    photographer || undefined,
    dateStart || undefined,
    dateEnd || undefined,
    sortBy || undefined,
    publicationCountries
  );
  const total = allResults.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const items = allResults.slice(start, start + pageSize);

  const response: SearchResponse = {
    items,
    page,
    pageSize,
    total,
    totalPages
  };

  const responseTime = performance.now() - startTime;
  recordSearch(query, responseTime);

  return NextResponse.json(response);
}
