// src/components/dashboard/AdminReviewModeration.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Star,
  Flag,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';

interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  location: {
    id: string;
    name: string;
    type: string;
  };
  rating: number;
  title?: string;
  comment: string;
  flagged_count: number;
  helpful_count: number;
  status: 'active' | 'flagged' | 'hidden';
  response?: string;
  moderation_note?: string;
  created_at: string;
}

export default function AdminReviewModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'active' | 'hidden'>('flagged');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [moderationNote, setModerationNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const endpoint = filter === 'all' 
        ? '/reviews?status=all' 
        : filter === 'flagged'
        ? '/reviews/moderate/pending'
        : `/reviews?status=${filter}`;
      
      const { data } = await api.get(endpoint);
      setReviews(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Gagal memuat ulasan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (reviewId: string, newStatus: 'active' | 'hidden') => {
    setIsSubmitting(true);
    try {
      await api.put(`/reviews/${reviewId}/moderate`, {
        status: newStatus,
        moderation_note: moderationNote.trim() || null
      });

      toast.success(
        newStatus === 'active' 
          ? 'Ulasan berhasil disetujui' 
          : 'Ulasan berhasil disembunyikan'
      );
      
      setSelectedReview(null);
      setModerationNote('');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memoderasi ulasan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    const confirmed = confirm('Apakah Anda yakin ingin menghapus ulasan ini secara permanen?');
    if (!confirmed) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Ulasan berhasil dihapus');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus ulasan');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Aktif' },
      flagged: { color: 'bg-red-100 text-red-700', icon: Flag, label: 'Dilaporkan' },
      hidden: { color: 'bg-gray-100 text-gray-700', icon: EyeOff, label: 'Disembunyikan' }
    };
    const badge = badges[status as keyof typeof badges] || badges.active;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            Moderasi Ulasan
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola dan moderasi ulasan yang dilaporkan pengguna
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex gap-1">
        {[
          { key: 'flagged', label: 'Dilaporkan', icon: Flag },
          { key: 'all', label: 'Semua', icon: Eye },
          { key: 'active', label: 'Aktif', icon: CheckCircle },
          { key: 'hidden', label: 'Disembunyikan', icon: EyeOff }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              filter === key
                ? 'bg-green-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Stats Card */}
      {filter === 'flagged' && reviews.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">
                {reviews.length} Ulasan Memerlukan Moderasi
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Ulasan yang dilaporkan 3 kali atau lebih secara otomatis ditandai untuk moderasi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Shield className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Tidak Ada Ulasan {filter === 'flagged' ? 'yang Dilaporkan' : ''}
          </h3>
          <p className="text-gray-600">
            {filter === 'flagged' 
              ? 'Tidak ada ulasan yang memerlukan moderasi saat ini.' 
              : `Tidak ada ulasan dengan status "${filter}".`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {review.user.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      untuk <strong>{review.location.name}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(review.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(review.status)}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Title */}
              {review.title && (
                <h5 className="font-semibold text-gray-900 mb-2">
                  {review.title}
                </h5>
              )}

              {/* Comment */}
              <p className="text-gray-700 leading-relaxed mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {review.comment}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-4 text-sm">
                {review.flagged_count > 0 && (
                  <div className="flex items-center gap-2 text-red-600 font-semibold">
                    <Flag className="w-4 h-4" />
                    <span>{review.flagged_count} Laporan</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-green-600">
                  <MessageCircle className="w-4 h-4" />
                  <span>{review.helpful_count} Membantu</span>
                </div>
              </div>

              {/* Response */}
              {review.response && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Tanggapan Mitra:
                  </p>
                  <p className="text-sm text-gray-700">
                    {review.response}
                  </p>
                </div>
              )}

              {/* Moderation Note */}
              {review.moderation_note && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 rounded">
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    Catatan Moderasi:
                  </p>
                  <p className="text-sm text-gray-700">
                    {review.moderation_note}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {review.status !== 'active' && (
                  <button
                    onClick={() => handleModerate(review.id, 'active')}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Setujui
                  </button>
                )}
                
                {review.status !== 'hidden' && (
                  <button
                    onClick={() => setSelectedReview(review)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition disabled:opacity-50"
                  >
                    <EyeOff className="w-4 h-4" />
                    Sembunyikan
                  </button>
                )}

                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Hapus Permanen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moderation Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Sembunyikan Ulasan
            </h3>
            <p className="text-gray-600 mb-4">
              Ulasan ini akan disembunyikan dari publik. Anda dapat menambahkan catatan moderasi (opsional).
            </p>
            <textarea
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              rows={4}
              placeholder="Catatan moderasi (opsional)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedReview(null);
                  setModerationNote('');
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleModerate(selectedReview.id, 'hidden')}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Sembunyikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}