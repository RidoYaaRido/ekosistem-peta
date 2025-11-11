// src/components/dashboard/reviews/PublicReviewList.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Star, AlertTriangle, Edit, Trash2, MessageCircle } from 'lucide-react';
import Link from 'next/link';

// (Anda bisa pindahkan Interface Review ke file types)
interface Review {
  id: string;
  location: { id: string; name: string; };
  rating: number;
  title?: string;
  comment: string;
  status: 'active' | 'flagged' | 'hidden';
  response?: string;
  created_at: string;
}

export default function PublicReviewList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    setIsLoading(true);
    try {
      // Backend (getReviews) akan otomatis filter by user_id
      const { data } = await api.get('/reviews'); 
      setReviews(data.data);
    } catch (error) {
      toast.error('Gagal memuat ulasan Anda');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { text: 'Dipublikasi', color: 'bg-green-100 text-green-700' };
      case 'flagged':
        return { text: 'Ditandai', color: 'bg-red-100 text-red-700' };
      case 'hidden':
        return { text: 'Disembunyikan', color: 'bg-gray-100 text-gray-700' };
      default:
        return { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Ulasan Saya</h1>
      <p className="text-gray-600">Daftar semua ulasan yang pernah Anda berikan.</p>

      {isLoading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Anda belum pernah memberikan ulasan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => {
            const statusInfo = getStatusInfo(review.status);
            return (
              <div key={review.id} className="bg-white p-5 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Ulasan untuk:</p>
                    <Link href={`/location/${review.location.id}`} className="text-lg font-semibold text-green-600 hover:underline">
                      {review.location.name}
                    </Link>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>

                <div className="flex items-center gap-1 my-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                  ))}
                </div>
                
                {review.title && <h4 className="font-semibold text-gray-800">{review.title}</h4>}
                <p className="text-gray-600 mt-1">{review.comment}</p>
                
                {review.response && (
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Tanggapan Mitra:
                    </p>
                    <p className="text-sm text-gray-700 mt-2">{review.response}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                   <p className="text-xs text-gray-500">
                     Ditulis pada {new Date(review.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                   </p>
                   {/* TODO: Tambahkan fungsi Edit/Delete jika diinginkan */}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}