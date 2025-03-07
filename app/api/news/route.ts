import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    const q = searchParams.get('q') || '';
    const page = searchParams.get('page') || '1';
    const location = searchParams.get('location') || 'us';
    
    const apiKey = process.env.GOOGLE_NEWS_API_KEY;
    const url = `https://newsapi.org/v2/top-headlines?country=${location}&apiKey=${apiKey}&category=${category}&q=${q}&page=${page}`;
    
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
