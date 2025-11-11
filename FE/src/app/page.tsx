// src/app/page.tsx - Homepage with Map (Improved)
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import FilterSidebar from '@/components/map/FilterSidebar';
import { MapPin, Package, Award, Users, Menu, X, Layers } from 'lucide-react';

const MapContainer = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  const { checkAuth, isAuthenticated, user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="relative h-screen overflow-hidden">
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-white shadow-md h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-green-600">Eco-Peta</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">
              Beranda
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 font-medium">
              Tentang
            </Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-green-600 font-medium">
              Cara Kerja
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </header>

      {/* MOBILE MENU SIDEBAR */}
      <div
        className={`md:hidden fixed top-20 right-0 h-[calc(100vh-5rem)] w-64 bg-white shadow-xl z-[1001] transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 space-y-6">
          <nav className="space-y-4">
            <Link
              href="/"
              className="block text-gray-700 hover:text-green-600 font-medium py-2 border-b border-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Beranda
            </Link>
            <Link
              href="/about"
              className="block text-gray-700 hover:text-green-600 font-medium py-2 border-b border-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tentang
            </Link>
            <Link
              href="/how-it-works"
              className="block text-gray-700 hover:text-green-600 font-medium py-2 border-b border-gray-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Cara Kerja
            </Link>
          </nav>

          <div className="space-y-3">
            {isAuthenticated && user ? (
              <Link
                href="/dashboard"
                className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block w-full px-4 py-2 text-green-600 text-center border-2 border-green-600 rounded-lg hover:bg-green-50 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[1000] top-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* FILTER SIDEBAR */}
      <FilterSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* MAP CONTAINER */}
      <div
        className={`pt-20 transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-80' : 'lg:ml-0'
        }`}
      >
        <MapContainer />
      </div>

      {/* LEGEND - MODERN DESIGN - FIXED POSITION */}
      <div
        className={`fixed bottom-8 z-[998] transition-all duration-300 ${
          isSidebarOpen ? 'lg:left-[22rem]' : 'lg:left-8'
        } left-4 max-w-[280px]`}
      >
        {/* Toggle Button untuk Mobile */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="lg:hidden mb-2 px-4 py-2 bg-white rounded-lg shadow-lg flex items-center gap-2 hover:bg-gray-50 transition w-full justify-center"
        >
          <Layers className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            {showLegend ? 'Sembunyikan' : 'Tampilkan'} Legenda
          </span>
        </button>

        {/* Legend Content */}
        <div
          className={`bg-white rounded-xl shadow-xl p-5 border border-gray-100 ${
            showLegend ? 'block' : 'hidden'
          } lg:block`}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-green-600" />
              Legenda Peta
            </h4>
          </div>

          <div className="space-y-3">
            {/* Bank Sampah */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition">
              <div className="relative">
                <div className="w-10 h-10 bg-green-600 rounded-full border-3 border-white shadow-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div
                  className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '10px solid #16a34a',
                  }}
                />
              </div>
              <span className="text-sm text-gray-700 font-medium">Bank Sampah</span>
            </div>

            {/* Jasa Angkut */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-600 rounded-full border-3 border-white shadow-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                    <path d="M15 18H9" />
                    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                    <circle cx="17" cy="18" r="2" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                </div>
                <div
                  className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '10px solid #2563eb',
                  }}
                />
              </div>
              <span className="text-sm text-gray-700 font-medium">Jasa Angkut</span>
            </div>

            {/* Both */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition">
              <div className="relative">
                <div className="w-10 h-10 bg-purple-600 rounded-full border-3 border-white shadow-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div
                  className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '10px solid #8b5cf6',
                  }}
                />
              </div>
              <span className="text-sm text-gray-700 font-medium">Keduanya</span>
            </div>

            {/* User Location */}
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 transition border-t border-gray-100 pt-3 mt-3">
              <div className="relative">
                <div className="w-7 h-7 bg-red-500 rounded-full border-2 border-white shadow-md"></div>
                <div className="absolute inset-0 w-7 h-7 bg-red-500 rounded-full animate-pulse opacity-40"></div>
              </div>
              <span className="text-sm text-gray-700 font-medium">Lokasi Anda</span>
            </div>
          </div>
        </div>
      </div>

      {/* INFO CARDS - Desktop Only (Hidden on Mobile to reduce clutter) */}
      <div className="absolute bottom-8 right-8 z-[999] hidden xl:block">
        <div className="bg-white rounded-xl shadow-2xl p-6 w-80 space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            🌿 Eco-Peta Platform
          </h3>
          <p className="text-sm text-gray-600">
            Platform pengelolaan limbah daur ulang berbasis komunitas
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-green-50 transition">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Temukan Lokasi</p>
                <p className="text-xs text-gray-600">Bank sampah terdekat</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Request Pickup</p>
                <p className="text-xs text-gray-600">Jadwalkan penjemputan</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Kumpulkan Poin</p>
                <p className="text-xs text-gray-600">Tukar dengan reward</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Komunitas</p>
                <p className="text-xs text-gray-600">Bergabung dengan komunitas</p>
              </div>
            </div>
          </div>

          {!isAuthenticated && (
            <Link
              href="/register"
              className="block w-full py-2.5 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 font-medium mt-4 transition shadow-md hover:shadow-lg"
            >
              Mulai Sekarang
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
