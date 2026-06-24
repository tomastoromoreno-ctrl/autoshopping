'use client';

import { useEffect, useState } from 'react';
import { Star, CheckCircle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

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
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reviews/product/${productId}?limit=50`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reviews/stats/${productId}`),
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, rating, title: title || undefined, comment: comment || undefined }),
      });

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

    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    loadReviews();
  };

  if (loading) {
    return <div className="py-8 text-center text-sm text-slate-400">Cargando reseñas...</div>;
  }

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Reseñas</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {showForm ? 'Cancelar' : 'Escribir reseña'}
        </button>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row gap-6 rounded-xl bg-slate-50 p-4">
          <div className="text-center sm:text-left">
            <p className="text-3xl font-bold text-slate-900">{stats.average}</p>
            <div className="mt-1 flex items-center justify-center sm:justify-start gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(stats.average) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                />
              ))}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{stats.total} reseñas</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const dist = stats.distribution.find((d) => d.star === star);
              const count = dist?.count || 0;
              const pct = stats.total ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-slate-500">{star}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200">
                    <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-700 mb-3">Tu calificación</p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    star <= (hoveredStar || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
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
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 mb-3"
          />

          <textarea
            placeholder="Cuéntanos tu experiencia..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
          />

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Publicar reseña'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No hay reseñas aún. Sé el primero en opinar.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                    {review.users?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{review.users?.name || 'Anónimo'}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                        />
                      ))}
                      {review.is_verified && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" /> Compra verificada
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('es-CL')}</span>
                  {currentUserId && currentUserId === review.user_id && (
                    <button onClick={() => handleDelete(review.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {review.title && <p className="mt-2 font-medium text-slate-900">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm text-slate-600">{review.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
