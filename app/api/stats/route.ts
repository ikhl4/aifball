import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint'); // مثال: /fixtures/12345/lineups

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint parameter is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.thestatsapi.com/v1${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${process.env.THESTATSAPI_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) throw new Error('API Error');
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tactical data' }, { status: 500 });
  }
}
