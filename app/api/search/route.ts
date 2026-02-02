import {NextRequest, NextResponse} from 'next/server';
import {SearchResponse} from '@/app/types/media';
import {search} from '@/app/lib/search-index';

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  const query = request.nextUrl.searchParams.get('q') || '';

  const results = search(query);

  const response: SearchResponse = {
    items: results,
    page: 1,
    pageSize: results.length,
    total: results.length,
    totalPages: 1
  };

  return NextResponse.json(response);
}
