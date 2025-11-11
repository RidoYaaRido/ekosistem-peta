// src/components/dashboard/DashboardLayout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  MapPin,
  Package,
  Star,
  User,
  LogOut,
  Menu,
  X,
  Users,
  Settings,
  Award,
  FileText,
  ChevronRight,
  Home,
  Trash2,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Perbaikan Auth Loop
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const commonItems = [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'mitra', 'public'] },
      { href: '/dashboard/profile', icon: User, label: 'Profil', roles: ['admin', 'mitra', 'public'] },
    ];

    const publicItems = [
      { href: '/dashboard/pickups', icon: Package, label: 'Permintaan Saya', roles: ['public'] },
      { href: '/dashboard/reviews', icon: Star, label: 'Ulasan Saya', roles: ['public'] },
    ];

    const mitraItems = [
      { href: '/dashboard/locations', icon: MapPin, label: 'Lokasi Saya', roles: ['mitra'] },
      { href: '/dashboard/pickups', icon: Package, label: 'Jadwal Penjemputan', roles: ['mitra'] },
      { href: '/dashboard/reviews', icon: Star, label: 'Ulasan', roles: ['mitra'] },
      { href: '/dashboard/transactions', icon: FileText, label: 'Transaksi', roles: ['mitra'] },
    ];

    const adminItems = [
      { href: '/dashboard/users', icon: Users, label: 'Kelola User', roles: ['admin'] },
      { href: '/dashboard/locations', icon: MapPin, label: 'Kelola Lokasi', roles: ['admin'] },
      { href: '/dashboard/pickups', icon: Package, label: 'Semua Penjemputan', roles: ['admin'] },
      { href: '/dashboard/reviews', icon: Star, label: 'Moderasi Ulasan', roles: ['admin'] },
      { href: '/dashboard/waste-categories', icon: Trash2, label: 'Kategori Sampah', roles: ['admin'] },
      { href: '/dashboard/reports', icon: FileText, label: 'Laporan', roles: ['admin'] },
      { href: '/dashboard/settings', icon: Settings, label: 'Pengaturan', roles: ['admin'] },
    ];

    const allItems = [...commonItems, ...publicItems, ...mitraItems, ...adminItems];

    // Filter berdasarkan role user
    return allItems.filter(item => item.roles.includes(user.role));
  };

  const navigationItems = getNavigationItems();

  // Tampilkan spinner jika loading atau user belum siap
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: Menu Button & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:block hidden transition"
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition"
              aria-label="Toggle Mobile Menu"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-green-600 hidden sm:block">
                Eco-Peta
              </span>
            </Link>
          </div>

          {/* Right: User Info */}
          <div className="flex items-center gap-3">
            {/* Points Badge for Public Users */}
            {user.role === 'public' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-600">
                  {user.points || 0} Poin
                </span>
              </div>
            )}

            {/* User Avatar & Info */}
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-semibold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            
          </div>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-40 hidden lg:block overflow-y-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
                  isActive
                    ? 'bg-green-50 text-green-700 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </Link>
            );
          })}

          {/* Bottom Section */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-green-600 rounded-lg transition font-medium"
            >
              <Home className="w-5 h-5" />
              <span>Lihat Peta</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium mt-1"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 lg:hidden overflow-y-auto shadow-lg">
            <nav className="p-4 space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
                      isActive
                        ? 'bg-green-50 text-green-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                );
              })}

              {/* Bottom Section */}
              <div className="pt-4 mt-4 border-t border-gray-200">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-green-600 rounded-lg transition font-medium"
                >
                  <Home className="w-5 h-5" />
                  <span>Lihat Peta</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium mt-1"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Keluar</span>
                </button>
              </div>
            </nav>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
        className={`pt-16 min-h-screen transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
      >
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}