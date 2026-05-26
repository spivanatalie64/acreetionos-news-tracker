'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, AlertTriangle, Loader2, BookOpen } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

type LoadState = 'loading' | 'ready' | 'error';

interface Article {
  title: string;
  byline: string | null;
  content: string;
  excerpt: string | null;
  siteName: string;
  length: number;
}

export default function ReadPage() {
  const searchParams = useSearchParams();
  const targetUrl = useMemo(() => searchParams.get('url') || '', [searchParams]);
  const [state, setState] = useState<LoadState>('loading');
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetUrl) {
      setState('error');
      setError('Missing article URL.');
      return;
    }

    const controller = new AbortController();

    const loadArticle = async () => {
      try {
        setState('loading');

        const response = await fetch(`/api/read-article?url=${encodeURIComponent(targetUrl)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load article: ${response.status}`);
        }

        const data = await response.json();
        setArticle(data);
        setState('ready');
      } catch (err: any) {
        if (!controller.signal.aborted) {
          setError(err.message || 'Could not load this article.');
          setState('error');
        }
      }
    };

    loadArticle();

    return () => controller.abort();
  }, [targetUrl]);

  const siteColor = article?.siteName?.toLowerCase().includes('arch') ? 'text-blue-400' : 'text-green-500';

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Link>
          <div className="flex items-center gap-3">
            {article?.siteName && (
              <span className={`text-xs font-medium ${siteColor} hidden sm:inline`}>{article.siteName}</span>
            )}
            {targetUrl && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full transition-colors"
              >
                Original <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {state === 'loading' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading article...</p>
          </div>
        )}

        {state === 'error' && (
          <div className="max-w-2xl mx-auto bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Could not load article</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            {targetUrl && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full shadow-sm transition-colors"
              >
                Open Original Article <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {state === 'ready' && article && (
          <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{article.siteName}</span>
                {article.byline && <><span>·</span><span>{article.byline}</span></>}
                {article.length > 0 && <><span>·</span><span>{Math.ceil(article.length / 1000)} min read</span></>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="mt-3 text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
            </div>
            <div
              className="px-6 sm:px-10 py-6 sm:py-8 prose prose-slate dark:prose-invert prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-green-600 dark:prose-a:text-green-400 prose-img:rounded-lg prose-blockquote:border-green-500 prose-blockquote:bg-green-50 dark:prose-blockquote:bg-green-950/30 max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />
          </article>
        )}
      </div>
    </main>
  );
}
