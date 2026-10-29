import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'NVDA';

  try {
    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=5`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 900 } // 15 Minuten Caching
    });

    if (!res.ok) {
      return NextResponse.json({ news: [] });
    }

    const data = await res.json();
    const newsItems = data.news || [];

    const formattedNews = newsItems.map((item: any) => ({
      id: item.uuid || item.link,
      title: item.title,
      publisher: item.publisher,
      link: item.link,
      providerPublishTime: item.providerPublishTime 
        ? new Date(item.providerPublishTime * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'Recent'
    }));

    return NextResponse.json({ news: formattedNews });
  } catch (err) {
    return NextResponse.json({ news: [] });
  }
}
