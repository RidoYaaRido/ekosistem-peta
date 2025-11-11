// src/app/(dashboard)/pickups/page.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import AdminPickupManager from '@/components/dashboard/pickups/AdminPickupManager';
import MitraPickupSchedule from '@/components/dashboard/pickups/MitraPickupSchedule';
import PublicPickupList from '@/components/dashboard/pickups/PublicPickupList';

export default function PickupsPage() {
  const { user, isLoading } = useAuthStore();

  // Tampilkan loading spinner
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Tampilkan komponen yang sesuai berdasarkan peran
  return (
    <div>
      {user.role === 'admin' && <AdminPickupManager />}
      {user.role === 'mitra' && <MitraPickupSchedule />}
      {user.role === 'public' && <PublicPickupList />}
    </div>
  );
}