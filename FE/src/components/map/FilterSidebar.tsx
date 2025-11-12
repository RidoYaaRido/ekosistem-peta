// src/components/map/FilterSidebar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationStore } from '../../store/locationStore';
import { X, Search, Filter, MapPin, Star, Phone, Navigation2, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

const RATING_FILTERS = [
  { value: '', label: 'Semua Rating' },
  { value: '4', label: '⭐ 4+ Rating' },
  { value: '3', label: '⭐ 3+ Rating' },
  { value: '2', label: '⭐ 2+ Rating' },
  { value: '1', label: '⭐ 1+ Rating' },
];

const LOCATION_TYPES = [
  { value: '', label: 'Semua Tipe' },
  { value: 'bank_sampah', label: 'Bank Sampah' },
  { value: 'jasa_angkut', label: 'Jasa Angkut' },
  { value: 'both', label: 'Bank Sampah & Jasa Angkut' },
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Terdekat', icon: Navigation2 },
  { value: 'rating-desc', label: 'Rating Tertinggi', icon: TrendingUp },
  { value: 'rating-asc', label: 'Rating Terendah', icon: TrendingDown },
  { value: 'reviews', label: 'Ulasan Terbanyak', icon: Star },
];

interface FilterSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLocationClick?: (location: any) => void;
}

export default function FilterSidebar({ isOpen, setIsOpen, onLocationClick }: FilterSidebarProps) {
  const router = useRouter();
  const { filters, setFilters, searchLocations, locations, isLoading, setSelectedLocation } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchLocations(searchQuery);
    }
  };

  const getSortedLocations = () => {
    let sorted = [...locations];
    
    switch (sortBy) {
      case 'distance':
        sorted.sort((a, b) => {
          if (a.distance_km == null) return 1;
          if (b.distance_km == null) return -1;
          return a.distance_km - b.distance_km;
        });
        break;
      
      case 'rating-desc':
        sorted.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });
        break;
      
      case 'rating-asc':
        sorted.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingA - ratingB;
        });
        break;
      
      case 'reviews':
        sorted.sort((a, b) => {
          const reviewsA = a.total_reviews || 0;
          const reviewsB = b.total_reviews || 0;
          return reviewsB - reviewsA;
        });
        break;
    }
    
    return sorted;
  };

  const sortedLocations = getSortedLocations();

  const handleLocationItemClick = (location: any) => {
    setSelectedLocation(location);
    if (onLocationClick) {
      onLocationClick(location);
    }
  };

  // Navigasi ke halaman detail
  const handleViewDetail = (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation(); // Prevent zoom trigger
    router.push(`/location/${locationId}`);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-24 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
      >
        <Filter className="w-5 h-5 text-green-600" />
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-20 left-0 h-[calc(100vh-5rem)] bg-white shadow-xl z-[999] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-80 lg:w-96 overflow-hidden flex flex-col`}
      >
        {/* Header - Fixed */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-green-600" />
              Filter Lokasi
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-white rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-400"
              />
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            </div>
          </form>
        </div>

        {/* Filters - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Tipe Lokasi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipe Lokasi
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              >
                {LOCATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Rating */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.minRating || ''}
                onChange={(e) => setFilters({ minRating: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              >
                {RATING_FILTERS.map((rating) => (
                  <option key={rating.value} value={rating.value}>
                    {rating.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Urutkan Berdasarkan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        sortBy === option.value
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{option.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Radius: <span className="text-green-600">{filters.radius} km</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={filters.radius}
                onChange={(e) => setFilters({ radius: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Verified Only */}
            <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="verified"
                checked={filters.verified}
                onChange={(e) => setFilters({ verified: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="verified" className="ml-2 text-sm font-medium text-gray-700">
                Hanya lokasi terverifikasi
              </label>
            </div>

            {/* Reset Filter */}
            <button
              onClick={() => {
                setFilters({
                  type: '',
                  radius: 10,
                  minRating: '',
                  verified: false,
                });
                setSortBy('distance');
                setSearchQuery('');
              }}
              className="w-full py-2.5 px-4 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition"
            >
              Reset Semua Filter
            </button>
          </div>

          {/* Results Count */}
          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 border-y border-gray-200">
            <p className="text-sm text-gray-700 text-center">
              Ditemukan <span className="font-bold text-green-700">{sortedLocations.length}</span> lokasi
            </p>
          </div>

          {/* Location List */}
          <div className="p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Hasil Pencarian
            </h3>
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Memuat lokasi...</p>
                </div>
              ) : sortedLocations.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Tidak ada lokasi ditemukan</p>
                  <p className="text-xs text-gray-400 mt-1">Coba ubah filter Anda</p>
                </div>
              ) : (
                sortedLocations.map((location, index) => (
                  <div
                    key={location.id}
                    className="group p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 cursor-pointer transition-all duration-200 hover:shadow-md relative"
                  >
                    {/* Main clickable area - Zoom to location */}
                    <div onClick={() => handleLocationItemClick(location)}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-10">
                          <h4 className="font-semibold text-sm text-gray-800 group-hover:text-green-700 truncate">
                            {index + 1}. {location.name}
                          </h4>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium capitalize">
                              {location.type?.replace('_', ' ')}
                            </span>
                            {location.verified && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 line-clamp-2">{location.city}</p>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Rating */}
                        {location.rating != null && location.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-bold text-gray-800">
                              {location.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({location.total_reviews || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Belum ada rating</span>
                        )}

                        {/* Distance */}
                        {location.distance_km != null && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                            <Navigation2 className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">
                              {location.distance_km.toFixed(1)} km
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Phone (on hover) */}
                      {location.phone && (
                        <div className="pt-2 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-700" />
                            <a
                              href={`tel:${location.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-gray-700 hover:underline"
                            >
                              {location.phone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detail Button - Separate click handler */}
                    <button
                      onClick={(e) => handleViewDetail(e, location.id)}
                      className="absolute top-2 right-2 p-2 bg-green-700 border-2 border-green-500 rounded-lg hover:bg-green-500 hover:text-white text-green-600 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                      title="Lihat Detail & Ulasan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
