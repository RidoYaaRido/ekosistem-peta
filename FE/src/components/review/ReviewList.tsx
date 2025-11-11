// src/components/review/ReviewList.tsx
'use client';

import { useEffect, useState } from 'react';
import { Star, ThumbsUp, Flag, MessageCircle, AlertCircle, Edit, Trash2, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    badge?: string;
  };
  rating: number;
  title?: string;
  comment: string;
  helpful_count: number;
  flagged_count: number;
  status: 'active' | 'flagged' | 'hidden';
  response?: string;
  response_date?: string;
  is_helpful_by_me?: boolean;
  created_at: string;
  updated_at: string;
}

interface ReviewListProps {
  locationId: string;
}

export default function ReviewList({ locationId }: ReviewListProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [responseModalOpen, setResponseModalOpen] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [locationId, sortBy]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/locations/${locationId}/reviews?sort=${sortBy}`);
      setReviews(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Gagal memuat ulasan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    try {
      await api.put(`/reviews/${reviewId}/helpful`);
      fetchReviews(); // Refresh to get updated count
      toast.success('Terima kasih atas feedback Anda!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memberikan vote');
    }
  };

  const handleFlag = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    const confirmed = confirm('Apakah Anda yakin ingin melaporkan ulasan ini?');
    if (!confirmed) return;

    try {
      await api.put(`/reviews/${reviewId}/flag`);
      toast.success('Ulasan berhasil dilaporkan');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal melaporkan ulasan');
    }
  };

  const handleDelete = async (reviewId: string) => {
    const confirmed = confirm('Apakah Anda yakin ingin menghapus ulasan ini?');
    if (!confirmed) return;

    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Ulasan berhasil dihapus');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus ulasan');
    }
  };

  const handleAddResponse = async (reviewId: string) => {
    if (responseText.trim().length < 10) {
      toast.error('Tanggapan minimal 10 karakter');
      return;
    }

    try {
      await api.put(`/reviews/${reviewId}/response`, {
        response: responseText.trim()
      });
      toast.success('Tanggapan berhasil ditambahkan');
      setResponseModalOpen(null);
      setResponseText('');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menambahkan tanggapan');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Memuat ulasan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan Sort */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          Ulasan ({reviews.length})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
        >
          <option value="recent">Terbaru</option>
          <option value="rating">Rating Tertinggi</option>
          <option value="helpful">Paling Membantu</option>
        </select>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Star className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-medium">Belum ada ulasan</p>
          <p className="text-sm text-gray-500 mt-2">
            Jadilah yang pertama memberikan ulasan untuk lokasi ini!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {review.user.name}
                      </h4>
                      {review.user.badge && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium capitalize">
                          {review.user.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex gap-1 ml-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= review.rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Title */}
              {review.title && (
                <h5 className="font-semibold text-gray-900 mb-2">
                  {review.title}
                </h5>
              )}

              {/* Comment */}
              <p className="text-gray-700 leading-relaxed mb-4">
                {review.comment}
              </p>

              {/* Updated indicator */}
              {review.updated_at !== review.created_at && (
                <p className="text-xs text-gray-500 italic mb-3">
                  Diperbarui {new Date(review.updated_at).toLocaleDateString('id-ID')}
                </p>
              )}

              {/* Mitra Response */}
              {review.response && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        Tanggapan dari Mitra
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {review.response}
                      </p>
                      {review.response_date && (
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(review.response_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 flex-wrap">
                {/* Helpful Button */}
                <button
                  onClick={() => handleHelpful(review.id)}
                  disabled={!isAuthenticated || review.user.id === user?.id}
                  className={`flex items-center gap-2 text-sm transition ${
                    review.is_helpful_by_me
                      ? 'text-green-600 font-semibold'
                      : 'text-gray-600 hover:text-green-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ThumbsUp className={`w-4 h-4 ${review.is_helpful_by_me ? 'fill-green-600' : ''}`} />
                  Membantu ({review.helpful_count})
                </button>

                {/* Flag Button */}
                {isAuthenticated && user?.id !== review.user.id && review.status === 'active' && (
                  <button
                    onClick={() => handleFlag(review.id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition"
                  >
                    <Flag className="w-4 h-4" />
                    Laporkan
                  </button>
                )}

                {/* Edit Button (Owner only) */}
                {isAuthenticated && user?.id === review.user.id && review.status === 'active' && (
                  <button
                    onClick={() => setEditingReviewId(review.id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}

                {/* Delete Button (Owner or Admin) */}
                {isAuthenticated && (user?.id === review.user.id || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                )}

                {/* Response Button (Mitra/Admin only) */}
                {isAuthenticated && 
                 (user?.role === 'mitra' || user?.role === 'admin') && 
                 !review.response && 
                 review.status === 'active' && (
                  <button
                    onClick={() => setResponseModalOpen(review.id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Tanggapi
                  </button>
                )}

                {/* Status Badges */}
                {review.status === 'flagged' && (
                  <span className="ml-auto flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                    <Shield className="w-3 h-3" />
                    Dilaporkan ({review.flagged_count}x)
                  </span>
                )}

                {review.status === 'hidden' && user?.role === 'admin' && (
                  <span className="ml-auto px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                    Disembunyikan
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {responseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Tambahkan Tanggapan
            </h3>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={5}
              placeholder="Tulis tanggapan Anda..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
            />
            <div className="text-right text-sm text-gray-500 mt-1 mb-4">
              {responseText.length} karakter (Min. 10)
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setResponseModalOpen(null);
                  setResponseText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => handleAddResponse(responseModalOpen)}
                disabled={responseText.trim().length < 10}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                Kirim Tanggapan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}