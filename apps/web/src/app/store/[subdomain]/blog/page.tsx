'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

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

export default function BlogListPage({ params }: { params: { subdomain: string } }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const [storeRes, postsRes] = await Promise.all([
          fetch(`${apiUrl}/stores/${params.subdomain}/public`),
          fetch(`${apiUrl}/blog?status=published&tenant=${params.subdomain}`),
        ]);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStore(storeData);
        }

        if (postsRes.ok) {
          const data = await postsRes.json();
          setPosts(Array.isArray(data) ? data : data.posts || data.data || []);
        }
      } catch (err) {
        console.error('Error loading blog:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const primaryColor = store?.primary_color || '#2563eb';
  const btnColor = store?.btn_color || store?.primary_color || '#2563eb';
  const btnTextColor = store?.btn_text_color || '#ffffff';
  const fontFamily = store?.font_family || 'Inter';
  const bgColor = store?.bg_color || '#ffffff';
  const textColor = store?.text_color || '#0f172a';

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor, fontFamily }}>
      <style jsx global>{`
        .store-btn { background-color: ${btnColor}; color: ${btnTextColor}; }
        .store-btn:hover { opacity: 0.9; }
        .store-text { color: ${textColor}; }
        .store-bg-card { background-color: ${bgColor}; }
        .store-chip-active { background-color: ${primaryColor}; color: white; }
        .store-chip-inactive { background-color: ${bgColor}; color: ${textColor}; border-color: ${primaryColor}; }
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

      {/* Blog Section */}
      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold store-text tracking-tight">
              Blog de {store?.name || 'Tienda'}
            </h1>
            <p className="mt-4 text-lg text-slate-600 store-text">
              Novedades, guías y consejos para tu experiencia deportiva
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold store-text">No hay publicaciones aún</h2>
              <p className="mt-2 text-slate-500">El primer artículo aparecerá aquí cuando se publique.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/store/${params.subdomain}/blog/${post.slug}`}
                  className="group block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 store-bg-card"
                >
                  <div className="md:flex">
                    {post.cover_image && (
                      <div className="md:w-64 relative aspect-[4/3] md:aspect-auto md:h-full overflow-hidden">
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="p-6 md:flex-1">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.created_at}>
                          {format(new Date(post.created_at), 'd MMMM yyyy', { locale: es })}
                        </time>
                        <span className="h-4 w-px bg-slate-200" />
                        <Clock className="h-4 w-4" />
                        <span>{Math.ceil((post.content?.length || 0) / 200)} min lectura</span>
                      </div>
                      <h2 className="text-xl font-heading font-bold store-text group-hover:text-primary transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-slate-600 line-clamp-3 mb-4 store-text">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                        Leer artículo
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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