'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  cover_image?: string;
  content: string;
  created_at: string;
}

interface StoreData {
  name: string;
  logo?: string;
  primary_color?: string;
  btn_color?: string;
  btn_text_color?: string;
  font_family?: string;
  bg_color?: string;
  text_color?: string;
}

export default function BlogPostPage({ params }: { params: { subdomain: string; slug: string } }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const [storeRes, postRes] = await Promise.all([
          fetch(`${apiUrl}/stores/${params.subdomain}/public`),
          fetch(`${apiUrl}/blog/${params.slug}`),
        ]);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData);
        }

        if (postRes.ok) {
          const postData = await postRes.json();
          setPost(postData);
        }
      } catch (err) {
        console.error('Error loading post:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.subdomain, params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <h1 className="text-5xl font-heading font-bold text-slate-900">404</h1>
        <p className="mt-3 text-lg text-slate-500">Artículo no encontrado</p>
        <Link
          href={`/store/${params.subdomain}/blog`}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Volver al blog
        </Link>
      </div>
    );
  }

  const primaryColor = store?.primary_color || '#2563eb';
  const btnColor = store?.btn_color || store?.primary_color || '#2563eb';
  const btnTextColor = store?.btn_text_color || '#ffffff';
  const fontFamily = store?.font_family || 'Inter';
  const bgColor = store?.bg_color || '#ffffff';
  const textColor = store?.text_color || '#0f172a';

  // Simple markdown-like rendering for basic formatting
  function renderContent(content: string) {
    return (
      <div className="prose prose-lg max-w-none store-text" style={{ fontFamily }}>
        {content.split('\n\n').map((paragraph, i) => {
          if (paragraph.startsWith('## ')) {
            return <h2 key={i} className="text-2xl font-bold mt-8 mb-4 store-text">{paragraph.slice(3)}</h2>;
          }
          if (paragraph.startsWith('### ')) {
            return <h3 key={i} className="text-xl font-bold mt-6 mb-3 store-text">{paragraph.slice(4)}</h3>;
          }
          if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
            return (
              <ul key={i} className="list-disc list-inside space-y-1 mt-2 mb-4 store-text">
                {paragraph.split('\n').map((line, j) => (
                  <li key={j}>{line.slice(2)}</li>
                ))}
              </ul>
            );
          }
          if (paragraph.match(/^\d+\. /)) {
            return (
              <ol key={i} className="list-decimal list-inside space-y-1 mt-2 mb-4 store-text">
                {paragraph.split('\n').map((line, j) => (
                  <li key={j}>{line.replace(/^\d+\.\s/, '')}</li>
                ))}
              </ol>
            );
          }
          return <p key={i} className="mt-4 text-slate-700 leading-relaxed">{paragraph}</p>;
        })}
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post.title;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(shareUrl);
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor, fontFamily }}>
      <style jsx global>{`
        .store-btn { background-color: ${btnColor}; color: ${btnTextColor}; }
        .store-btn:hover { opacity: 0.9; }
        .store-text { color: ${textColor}; }
        .store-bg-card { background-color: ${bgColor}; }
      `}</style>

      {/* Store Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href={`/store/${params.subdomain}`} className="flex items-center gap-2">
              {store?.logo ? (
                <img src={store.logo} alt={store.name} className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-bold store-text">{store?.name || 'Tienda'}</span>
              )}
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href={`/store/${params.subdomain}`} className="store-text hover:text-primary transition">Inicio</Link>
              <Link href={`/store/${params.subdomain}/blog`} className="store-text hover:text-primary transition font-semibold">Blog</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Article */}
      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href={`/store/${params.subdomain}/blog`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al blog
          </Link>

          {/* Article header */}
          <article>
            <header className="mb-8">
              <time 
                dateTime={post.created_at} 
                className="flex items-center gap-1.5 text-sm text-slate-500 mb-3"
              >
                <Calendar className="h-4 w-4" />
                {format(new Date(post.created_at), 'd MMMM yyyy', { locale: es })}
                <span className="h-4 w-px bg-slate-200 mx-1.5" />
                <Clock className="h-4 w-4" />
                <span>{Math.ceil((post.content?.length || 0) / 200)} min lectura</span>
              </time>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold store-text leading-tight">
                {post.title}
              </h1>
            </header>

            {/* Cover image */}
            {post.cover_image && (
              <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="store-text">
              {renderContent(post.content)}
            </div>

            {/* Share section */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium store-text">Compartir:</span>
                <button
                  onClick={handleShare}
                  className="store-btn flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Compartir
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors rounded-lg hover:bg-slate-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar enlace
                </button>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} {store?.name || 'Tienda'}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}