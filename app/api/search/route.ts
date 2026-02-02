import {NextRequest, NextResponse} from 'next/server';
import {SearchResponse} from '@/app/types/media';
import {search} from '@/app/lib/search-index';

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  const query = request.nextUrl.searchParams.get('q') || '';
  const photographer = request.nextUrl.searchParams.get('photographer') || '';
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('pageSize') || '20')));

  const allResults = search(query, photographer || undefined);
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

  return NextResponse.json(response);
}
