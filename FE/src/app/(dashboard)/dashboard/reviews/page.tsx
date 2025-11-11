// src/app/(dashboard)/dashboard/reviews/page.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import AdminReviewModeration from '@/components/dashboard/AdminReviewModeration';
import MitraReviewDashboard from '@/components/dashboard/reviews/MitraReviewDashboard';

import PublicReviewList from '@/components/dashboard/reviews/PublicReviewList';

export default function ReviewsPage() {
  const { user, isLoading } = useAuthStore();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Tampilkan komponen yang sesuai berdasarkan peran
  // AdminReviewModeration sudah Anda miliki
  switch (user.role) {
    case 'admin':
      return <AdminReviewModeration />;
    case 'mitra':
      return <MitraReviewDashboard />;
    case 'public':
      return <PublicReviewList />;
    default:
      return null;
  }
}