import { NextResponse } from 'next/server';
import { getAnalytics } from '@/app/lib/analytics';

export async function GET() {
  return NextResponse.json(getAnalytics());
}
