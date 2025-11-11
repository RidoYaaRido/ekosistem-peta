'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  MapPin, 
  Award, 
  LogOut, 
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface DashboardHeaderProps {
  onToggleSidebar?: () => void; // Untuk toggle sidebar desktop dari parent
  isSidebarOpen?: boolean;
}

export default function DashboardHeader({ 
  onToggleSidebar, 
  isSidebarOpen 
}: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
    setMobileMenuOpen(false);
  };

  if (!isAuthenticated || !user) return null;

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Left: Logo + Menu Toggle */}
          <div className="flex items-center gap-3">
            {/* Desktop Sidebar Toggle */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            {/* Mobile Menu Toggle */}
<button
  onClick={onToggleSidebar}
  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
  aria-label="Toggle sidebar"
>
  {isSidebarOpen ? (
    <X className="w-6 h-6 text-gray-700" />
  ) : (
    <Menu className="w-6 h-6 text-gray-700" />
  )}
</button>


            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-md">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-gray-900">Eco-Peta</span>
                <p className="text-[10px] text-gray-500 -mt-0.5">Dashboard</p>
              </div>
            </Link>
          </div>

          {/* Right: User Info */}
          <div className="flex items-center gap-3">
            {/* Points Badge - Hanya untuk public */}
            {user.role === 'public' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full border border-purple-200">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-bold text-purple-700">
                  {user.points || 0} Poin
                </span>
              </div>
            )}

            {/* User Dropdown Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize flex items-center gap-1">
                  {user.role === 'admin' ? '👑 Admin' : user.role === 'mitra' ? '🏢 Mitra' : '🌱 Pengguna'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Menu */}
      <div
        className={`fixed inset-0 z-[999] transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar */}
        <div
          className={`absolute top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {user.role === 'admin' ? '👑 Admin' : user.role === 'mitra' ? '🏢 Mitra' : '🌱 Pengguna'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/80 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Points (Public Only) */}
            {user.role === 'public' && (
              <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Poin Anda</p>
                    <p className="text-2xl font-bold text-purple-700">{user.points || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-5 space-y-3 flex-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl font-medium hover:bg-green-100 transition"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard Utama
              </Link>

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl font-medium transition"
              >
                <MapPin className="w-5 h-5" />
                Lihat Peta Publik
              </Link>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition"
                >
                  <LogOut className="w-5 h-5" />
                  Keluar dari Akun
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                © 2025 Eco-Peta. All rights reserved.
              </p>
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <Link href="/privacy" className="text-green-600 hover:underline">Privacy</Link>
                <span className="text-gray-400">•</span>
                <Link href="/terms" className="text-green-600 hover:underline">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}