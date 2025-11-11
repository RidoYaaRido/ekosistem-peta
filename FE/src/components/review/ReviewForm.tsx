// src/components/review/ReviewForm.tsx
'use client';

import { useState } from 'react';
import { Star, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface ReviewFormProps {
  locationId: string;
  pickupId?: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ locationId, pickupId, onSuccess }: ReviewFormProps) {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'Pilih rating terlebih dahulu';
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'Ulasan minimal 10 karakter';
    }

    if (comment.trim().length > 500) {
      newErrors.comment = 'Ulasan maksimal 500 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const toastId = toast.loading('Mengirim ulasan...');
    setIsLoading(true);

    try {
      const payload: any = {
        rating,
        comment: comment.trim(),
        title: title.trim() || undefined
      };

      if (pickupId) {
        payload.pickup_id = pickupId;
      }

      await api.post(`/locations/${locationId}/reviews`, payload);

      toast.success('Ulasan berhasil ditambahkan!', { id: toastId });
      
      setRating(0);
      setTitle('');
      setComment('');
      setErrors({});
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Gagal menambahkan ulasan';
      toast.error(errorMessage, { id: toastId });
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'public') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Hanya pengguna publik yang dapat memberikan ulasan
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Jika Anda adalah mitra, Anda dapat merespons ulasan yang masuk.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const ratingLabels = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-lg font-bold text-gray-800">Tulis Ulasan</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Ulasan Anda sangat berharga</span>
        </div>
      </div>

      {pickupId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Ulasan untuk penjemputan</strong>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Ulasan Anda akan membantu pengguna lain mengetahui kualitas layanan penjemputan.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
                aria-label={`Rating ${star} bintang`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-sm text-gray-600 font-medium">
              {ratingLabels[rating - 1]}
            </span>
          )}
        </div>
        {errors.rating && (
          <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.rating}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Judul Ulasan (Opsional)
        </label>
        <input
          type="text"
          maxLength={100}
          placeholder="Contoh: Pelayanan cepat dan ramah"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {title.length}/100
        </div>
      </div>


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ulasan Anda <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={5}
          minLength={10}
          maxLength={500}
          placeholder="Bagikan pengalaman Anda dengan lokasi ini..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
            errors.comment ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        <div className="flex items-center justify-between mt-1">
          <div>
            {errors.comment && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.comment}
              </p>
            )}
          </div>
          <div className={`text-xs ${comment.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
            {comment.length}/500 (Min. 10)
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Pedoman Ulasan:</p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Berikan ulasan yang jujur dan konstruktif</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Jelaskan pengalaman Anda secara spesifik</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Hindari bahasa kasar atau menyinggung</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">•</span>
            <span>Ulasan yang melanggar aturan akan dihapus oleh moderator</span>
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || rating === 0 || comment.trim().length < 10}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Mengirim...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            Kirim Ulasan
          </>
        )}
      </button>
    </div>
  );
}