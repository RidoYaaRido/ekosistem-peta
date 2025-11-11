// src/components/auth/ProtectedRoute.tsx (Diperbaiki)
'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
// STEP 1: Impor ReactNode dan ubah impor useEffect
import React, { useEffect } from 'react';

// STEP 2: Definisikan props untuk 'children'
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // STEP 3: Ambil 'isLoading' dari store
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  // STEP 4: Jalankan checkAuth() sekali saat komponen dimuat
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // STEP 5: Pisahkan logika redirect ke useEffect yang baru
  useEffect(() => {
    // Hanya jalankan pengecekan SETELAH loading selesai
    if (!isLoading) {
      // Jika loading selesai DAN tidak terautentikasi, redirect
      if (!isAuthenticated) {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]); // Awasi perubahan state ini

  // STEP 6: Tampilkan loading (atau null) saat mengecek auth
  if (isLoading) {
    // Kamu bisa ganti ini dengan komponen Loading/Spinner yang bagus
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // STEP 7: Hanya tampilkan 'children' jika loading selesai DAN terautentikasi
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;
