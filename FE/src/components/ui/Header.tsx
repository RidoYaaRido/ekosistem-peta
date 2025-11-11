'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
  const { checkAuth, isAuthenticated, user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] bg-white shadow-md h-20">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-green-600">Eco-Peta</h1>
        </div>

        {/* NAVIGATION (Desktop) */}
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

        {/* AUTH BUTTONS (Desktop) */}
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

        {/* BURGER MENU (Mobile) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-700 hover:text-green-600 focus:outline-none"
        >
          {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* MENU MOBILE */}
      {menuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white shadow-md z-[999] animate-slide-down">
          <nav className="flex flex-col items-start px-6 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              Beranda
            </Link>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              Tentang
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMenuOpen(false)}
              className="text-gray-700 hover:text-green-600 font-medium"
            >
              Cara Kerja
            </Link>

            <div className="border-t border-gray-200 pt-3 w-full">
              {isAuthenticated && user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
