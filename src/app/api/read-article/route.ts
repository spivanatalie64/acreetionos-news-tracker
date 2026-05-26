import { NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: 502 });
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json({ error: 'Could not extract article content' }, { status: 422 });
    }

    return NextResponse.json({
      title: article.title || 'Untitled',
      byline: article.byline || null,
      content: article.content || '',
      excerpt: article.excerpt || null,
      siteName: article.siteName || new URL(url).hostname.replace(/^www\./, ''),
      length: article.length || 0,
    });
  } catch (error: any) {
    console.error('Error reading article:', error);
    return NextResponse.json({ error: error.message || 'Failed to read article' }, { status: 500 });
  }
}
