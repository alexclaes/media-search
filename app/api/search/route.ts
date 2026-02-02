import { NextRequest, NextResponse } from 'next/server';
import {MediaItem, SearchResponse} from '@/app/types/media';

export async function GET(request: NextRequest): Promise<NextResponse<SearchResponse>> {

  const mediaItems: MediaItem[] = [
    {
      id: "0059987730",
      searchText: "J.Morris, Manchester Utd inside right 7th January 1948 UnitedArchives00421716 PUBLICATIONxINxGERxSUIxAUTxONLY",
      photographer: "IMAGO / United Archives International",
      date: "01.01.1900",
      height: "2460",
      width: "3643"
    },
    {
      id: "0056821849",
      searchText: "Michael Jackson 11 95 her Mann Musik Gesang Pop USA Hemd leger Studio hoch ganz stehend Buhne...",
      photographer: "IMAGO / teutopress",
      date: "01.11.1995",
      height: "948",
      width: "1440"
    }
  ];

  const response: SearchResponse = {
    items: mediaItems,
    page: 1,
    pageSize: 10,
    total: mediaItems.length,
    totalPages: 1
  };

  return NextResponse.json(response);
}
