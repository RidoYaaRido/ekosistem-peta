
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  MapPin, Mail, Lock, Phone, User, MapPinned, 
  Building2, Briefcase, Eye, EyeOff, CheckCircle2,
  Sparkles, Shield, Zap
} from 'lucide-react';

interface Province {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isRegisterLoading: isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'public',
    street: '',
    city: '',
    province: '',
    businessName: '',
    businessType: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Fetch daftar provinsi
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch('/api/provinces');
        if (!res.ok) { // <-- Cek jika response 404 atau 500
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();
        
        // Cek apakah data adalah array sebelum di-set
        if (Array.isArray(data)) {
          setProvinces(data);
        } else {
          console.error('Data provinsi bukan array:', data);
          setProvinces([]); // Set ke array kosong jika gagal
        }
      } catch (error) {
        console.error('Gagal memuat provinsi:', error);
        setProvinces([]); // Set ke array kosong jika gagal
      }
    };
    fetchProvinces();
  }, []);

  // Fetch daftar kota
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.province) return;
      const selectedProvince = provinces.find(p => p.id === formData.province);
      if (!selectedProvince) return;

      setIsCityLoading(true);
      try {
        const res = await fetch(`/api/cities/${selectedProvince.id}`);
        const data = await res.json();
        setCities(data);
      } catch (error) {
        console.error('Gagal memuat kota:', error);
      } finally {
        setIsCityLoading(false);
      }
    };
    fetchCities();
  }, [formData.province, provinces]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'province') {
      setFormData({ ...formData, province: value, city: '' });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role,
        address: {
          street: formData.street,
          city: cities.find(c => c.id === formData.city)?.name || '',
          province: provinces.find(p => p.id === formData.province)?.name || '',
        },
      };

      if (formData.role === 'mitra') {
        userData.businessInfo = {
          businessName: formData.businessName,
          businessType: formData.businessType,
        };
      }

      await registerUser(userData);
      toast.success('Registrasi berhasil!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registrasi gagal');
    }
  };

  const validateStep1 = () => {
    return formData.name && formData.email && formData.password && formData.phone;
  };

  const validateStep2 = () => {
    return formData.street && formData.province && formData.city;
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-green-600 to-green-700 p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Eco-Peta</h1>
              <p className="text-green-100 text-sm">Platform Daur Ulang Digital</p>
            </div>
          </Link>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-4 border border-white/30">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Bergabung dengan Komunitas</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Mulai Perjalanan Hijau Anda! 🌱
              </h2>
              <p className="text-green-100 text-lg leading-relaxed">
                Daftar sekarang dan jadilah bagian dari gerakan daur ulang digital 
                yang mengubah sampah menjadi berkah!
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 text-lg">Gratis Selamanya</h3>
                  <p className="text-green-100 text-sm">
                    Tidak ada biaya tersembunyi, 100% gratis untuk semua fitur
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 text-lg">Dapatkan Reward</h3>
                  <p className="text-green-100 text-sm">
                    Tukar poin dengan uang tunai atau voucher menarik
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1 text-lg">Data Aman & Terenkripsi</h3>
                  <p className="text-green-100 text-sm">
                    Privasi dan keamanan data Anda adalah prioritas kami
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Budi Santoso</h4>
                <div className="flex text-yellow-300">★★★★★</div>
              </div>
            </div>
            <p className="text-green-100 text-sm italic">
              "Eco-Peta memudahkan saya menemukan bank sampah terdekat. 
              Dalam 3 bulan, saya sudah kumpulkan 50.000 poin!"
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MapPin className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Eco-Peta</h1>
                <p className="text-gray-600 text-sm">Platform Daur Ulang Digital</p>
              </div>
            </Link>
          </div>

          {/* Register Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Buat Akun Baru
              </h2>
              <p className="text-gray-600">
                Isi form di bawah untuk bergabung dengan komunitas kami
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4">

    {/* STEP 1 */}
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
          currentStep >= 1
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        1
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-xs sm:text-sm text-gray-900">
          Informasi Dasar
        </div>
        <div className="hidden sm:block text-xs text-gray-500">
          Data pribadi
        </div>
      </div>
    </div>

    {/* CONNECTOR */}
    <div
      className={`hidden sm:block flex-1 h-1 mx-4 rounded ${
        currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200'
      }`}
    ></div>

    {/* STEP 2 */}
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
          currentStep >= 2
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        2
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-xs sm:text-sm text-gray-900">
          Alamat
        </div>
        <div className="hidden sm:block text-xs text-gray-500">
          Lokasi
        </div>
      </div>
    </div>

    {/* STEP 3 — hanya untuk mitra */}
    {formData.role === 'mitra' && (
      <>
        <div
          className={`hidden sm:block flex-1 h-1 mx-4 rounded ${
            currentStep >= 3 ? 'bg-green-600' : 'bg-gray-200'
          }`}
        ></div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              currentStep >= 3
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            3
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-xs sm:text-sm text-gray-900">
              Bisnis
            </div>
            <div className="hidden sm:block text-xs text-gray-500">
              Info usaha
            </div>
          </div>
        </div>
      </>
    )}
  </div>
</div>


            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Lengkap *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Masukkan nama lengkap Anda"
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="nama@email.com"
                          className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        No. Telepon *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="08xxxxxxxxxx"
                          className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Minimal 6 karakter"
                        className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Password harus minimal 6 karakter
                    </p>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Daftar Sebagai *
                    </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <label className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.role === 'public'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300 hover:border-green-300'
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="public"
                          checked={formData.role === 'public'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-6 h-6 text-green-600" />
                          <span className="font-bold text-gray-900">Pengguna Umum</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Untuk rumah tangga yang ingin menyetor sampah daur ulang
                        </p>
                        {formData.role === 'public' && (
                          <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-green-600" />
                        )}
                      </label>

                      <label className={`relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.role === 'mitra'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="mitra"
                          checked={formData.role === 'mitra'}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3 mb-2">
                          <Building2 className="w-6 h-6 text-blue-600" />
                          <span className="font-bold text-gray-900">Mitra</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Untuk bank sampah & jasa angkut sampah
                        </p>
                        {formData.role === 'mitra' && (
                          <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-blue-600" />
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => validateStep1() && setCurrentStep(2)}
                    disabled={!validateStep1()}
                    className="w-full py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Lanjut ke Alamat →
                  </button>
                </div>
              )}

              {/* Step 2: Address */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  {/* Street Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Alamat Lengkap *
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-4 pointer-events-none">
                        <MapPinned className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="street"
                        type="text"
                        required
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan"
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Province & City */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Provinsi *
                      </label>
                      <select
                        name="province"
                        required
                        value={formData.province}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map((prov) => (
                          <option key={prov.id} value={prov.id}>{prov.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Kota/Kabupaten *
                      </label>
                      <select
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!formData.province || isCityLoading}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {isCityLoading ? 'Memuat kota...' : 'Pilih Kota'}
                        </option>
                        {cities.map((city) => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 py-3.5 px-4 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                    >
                      ← Kembali
                    </button>
                    
                    {formData.role === 'mitra' ? (
                      <button
                        type="button"
                        onClick={() => validateStep2() && setCurrentStep(3)}
                        disabled={!validateStep2()}
                        className="flex-1 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Lanjut ke Info Bisnis →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!validateStep2() || isLoading}
                        className="flex-1 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              ></path>
                            </svg>
                            Mendaftar...
                          </span>
                        ) : (
                          'Daftar Sekarang ✓'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Business Info (only for mitra) */}
              {currentStep === 3 && formData.role === 'mitra' && (
                <div className="space-y-5">
                  {/* Business Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nama Usaha *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        name="businessName"
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Nama bank sampah Anda"
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jenis Usaha *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="businessType"
                        required
                        value={formData.businessType}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Pilih Jenis Usaha</option>
                        <option value="bank_sampah">🏦 Bank Sampah</option>
                        <option value="jasa_angkut">📦 Jasa Angkut</option>
                      </select>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Verifikasi Mitra</h4>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          Setelah mendaftar, tim kami akan memverifikasi data usaha Anda dalam 1-3 hari kerja. 
                          Anda akan menerima email konfirmasi setelah akun disetujui.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 py-3.5 px-4 border-2 border-gray-300 rounded-xl text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
                    >
                      ← Kembali
                    </button>
                    
                    <button
                      type="submit"
                      disabled={!formData.businessName || !formData.businessType || isLoading}
                      className="flex-1 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            ></path>
                          </svg>
                          Mendaftar...
                        </span>
                      ) : (
                        'Daftar Sebagai Mitra ✓'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              {/* <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Atau daftar dengan</span>
              </div> */}
            </div>

            {/* Social Register Buttons */}
            {/* <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div> */}

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Sudah punya akun?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-green-600 hover:text-green-500 transition-colors"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>

            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                Dengan mendaftar, Anda menyetujui{' '}
                <Link href="/terms" className="text-green-600 hover:underline">
                  Syarat & Ketentuan
                </Link>
                {' '}dan{' '}
                <Link href="/privacy" className="text-green-600 hover:underline">
                  Kebijakan Privasi
                </Link>
                {' '}kami
              </p>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <Link href="/about" className="hover:text-green-600 transition-colors">
                Tentang
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/how-it-works" className="hover:text-green-600 transition-colors">
                Cara Kerja
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/contact" className="hover:text-green-600 transition-colors">
                Kontak
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              © 2025 Eco-Peta. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
