// src/components/dashboard/reviews/MitraReviewDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Star, AlertTriangle, MessageCircle } from 'lucide-react';
import Link from 'next/link';

// (Anda bisa pindahkan Interface Review ke file types)
interface Review {
  id: string;
  user: { id: string; name: string; };
  location: { id: string; name: string; };
  rating: number;
  title?: string;
  comment: string;
  status: 'active' | 'flagged' | 'hidden';
  response?: string;
  created_at: string;
}

export default function MitraReviewDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk modal respons
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMitraReviews();
  }, []);

  const fetchMitraReviews = async () => {
    setIsLoading(true);
    try {
      // Backend (getReviews) akan otomatis filter by location owner_id
      const { data } = await api.get('/reviews'); 
      setReviews(data.data);
    } catch (error) {
      toast.error('Gagal memuat ulasan untuk lokasi Anda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenResponseModal = (review: Review) => {
    setSelectedReview(review);
    setResponseText(review.response || '');
  };

  const handleCloseResponseModal = () => {
    setSelectedReview(null);
    setResponseText('');
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview) return;
    if (responseText.trim().length < 10) {
      return toast.error('Tanggapan minimal 10 karakter');
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Mengirim tanggapan...');
    
    try {
      // Panggil API 'addResponse'
      await api.put(`/reviews/${selectedReview.id}/response`, {
        response: responseText
      });
      toast.success('Tanggapan berhasil dikirim', { id: toastId });
      handleCloseResponseModal();
      fetchMitraReviews(); // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal mengirim tanggapan', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Ulasan Lokasi Saya</h1>
      <p className="text-gray-600">Lihat dan tanggapi ulasan dari pengguna untuk semua lokasi Anda.</p>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Anda belum menerima ulasan apapun.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white p-5 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Ulasan untuk:</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {review.location.name}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>

              <div className="my-3 border-t border-gray-100"></div>

              <p className="text-sm text-gray-500 mb-2">
                Dari: <span className="font-medium text-gray-700">{review.user.name}</span>
                {' '}pada {new Date(review.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </p>
              
              {review.title && <h4 className="font-semibold text-gray-800">{review.title}</h4>}
              <p className="text-gray-600 mt-1">{review.comment}</p>
              
              {review.response ? (
                <div className="mt-4 pt-4 border-t border-gray-100 bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> Tanggapan Anda:
                  </p>
                  <p className="text-sm text-gray-700 mt-2">{review.response}</p>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenResponseModal(review)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    Tanggapi Ulasan Ini
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal untuk Merespons */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Tanggapi Ulasan
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg border mb-4">
              <p className="text-sm text-gray-600">{selectedReview.comment}</p>
            </div>
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
                onClick={handleCloseResponseModal}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={isSubmitting || responseText.trim().length < 10}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Tanggapan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}