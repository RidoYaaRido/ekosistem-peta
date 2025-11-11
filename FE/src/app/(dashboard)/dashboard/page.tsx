// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PublicDashboard from '@/components/dashboard/PublicDashboard';
import MitraDashboard from '@/components/dashboard/MitraDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Tampilkan loading jika data user belum ada
  if (!user) {
    return (
      <div className="flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Logika untuk memilih dashboard berdasarkan role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'mitra':
      return <MitraDashboard />;
    case 'public':
      return <PublicDashboard />;
    default:
      return <PublicDashboard />;
  }
}