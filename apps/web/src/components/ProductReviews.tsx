'use client';

import { useEffect, useState } from 'react';
import { Star, CheckCircle, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified: boolean;
  created_at: string;
  users?: { name: string; avatar_url?: string };
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: { star: number; count: number }[];
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub || payload.id || null);
      }
    } catch {}
  }, []);

  const loadReviews = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reviews/product/${productId}?limit=50`
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reviews/stats/${productId}`
        ),
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.data || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Inicia sesión para dejar una reseña');
        setSubmitting(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            product_id: productId,
            rating,
            title: title || undefined,
            comment: comment || undefined,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Error al enviar reseña');
        setSubmitting(false);
        return;
      }

      setShowForm(false);
      setRating(5);
      setTitle('');
      setComment('');
      loadReviews();
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('¿Eliminar tu reseña?')) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reviews/${reviewId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    loadReviews();
  };

  if (loading) {
    return (
      <div className="mt-10 border-t border-slate-100 pt-10">
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-slate-100 pt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-slate-900">Reseñas</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary text-sm"
        >
          {showForm ? 'Cancelar' : 'Escribir reseña'}
        </button>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row gap-8 rounded-2xl bg-slate-50 p-6">
          <div className="text-center sm:text-left">
            <p className="text-4xl font-bold text-slate-900">{stats.average.toFixed(1)}</p>
            <div className="mt-2 flex items-center justify-center sm:justify-start gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(stats.average)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {stats.total} {stats.total === 1 ? 'reseña' : 'reseñas'}
            </p>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const dist = stats.distribution.find((d) => d.star === star);
              const count = dist?.count || 0;
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2.5 text-xs">
                  <span className="w-3 text-slate-500 font-medium">{star}</span>
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-2 rounded-full bg-slate-200/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-slate-400 font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-slate-900 mb-3">Tu calificación</p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5 transition-transform duration-150 hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 transition-colors duration-150 ${
                    star <= (hoveredStar || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-modern mb-3"
          />

          <textarea
            placeholder="Cuéntanos tu experiencia..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="input-modern resize-none"
          />

          {error && (
            <p className="mt-2 text-sm font-medium text-red-500">{error}</p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Publicar reseña'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-ghost text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <div className="py-12 text-center">
            <Star className="mx-auto h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">
              No hay reseñas aún. Sé el primero en opinar.
            </p>
          </div>
        ) : (
          reviews.map((review) => {
            const initials = review.users?.name
              ? review.users.name
                  .split(' ')
                  .map((n) => n.charAt(0))
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : '?';

            return (
              <div
                key={review.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition-shadow duration-200 hover:shadow-soft-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {review.users?.name || 'Anónimo'}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        {review.is_verified && (
                          <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                            <CheckCircle className="h-3 w-3" /> Compra verificada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {new Date(review.created_at).toLocaleDateString('es-CL')}
                    </span>
                    {currentUserId && currentUserId === review.user_id && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="rounded-lg p-1.5 text-slate-300 transition-colors duration-200 hover:bg-red-50 hover:text-red-500"
                        aria-label="Eliminar reseña"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {review.title && (
                  <p className="mt-3 font-semibold text-slate-900">{review.title}</p>
                )}
                {review.comment && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {review.comment}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
