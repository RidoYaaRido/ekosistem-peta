// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, Mail, ArrowLeft, CheckCircle, Send, Lock, KeyRound } from 'lucide-react';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Masukkan email Anda');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Mengirim kode OTP...');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      toast.success('Kode OTP telah dikirim ke email Anda!', { id: toastId });
      setCurrentStep('otp');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Gagal mengirim kode OTP';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Memverifikasi kode OTP...');

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      
      setResetToken(response.data.data.resetToken);
      toast.success('OTP berhasil diverifikasi!', { id: toastId });
      setCurrentStep('password');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Kode OTP tidak valid';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Masukkan password dan konfirmasi password');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Password dan konfirmasi password tidak sama');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Mereset password...');

    try {
      await api.put('/auth/reset-password', {
        resetToken,
        password,
        confirmPassword
      });
      
      toast.success('Password berhasil direset!', { id: toastId });
      setCurrentStep('success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Gagal mereset password';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Mengirim ulang kode OTP...');

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Kode OTP baru telah dikirim!', { id: toastId });
      setOtp('');
    } catch (error: any) {
      toast.error('Gagal mengirim ulang OTP', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-700 p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center w-full">
          <Link href="/" className="flex items-center gap-3 text-white mb-12">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Eco-Peta</h1>
              <p className="text-green-100 text-sm">Platform Daur Ulang Digital</p>
            </div>
          </Link>

          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Reset Password 🔐
            </h2>
            <p className="text-green-100 text-lg leading-relaxed mb-6">
              Ikuti langkah-langkah berikut untuk mereset password Anda dengan aman.
            </p>

            {/* Progress Steps */}
            <div className="space-y-4 mb-8">
              <div className={`flex items-center gap-4 ${currentStep === 'email' || currentStep === 'otp' || currentStep === 'password' || currentStep === 'success' ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'email' || currentStep === 'otp' || currentStep === 'password' || currentStep === 'success' ? 'bg-white text-green-600' : 'bg-white/20 text-white'}`}>
                  1
                </div>
                <div>
                  <p className="text-white font-semibold">Verifikasi Email</p>
                  <p className="text-green-100 text-sm">Masukkan email terdaftar</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 ${currentStep === 'otp' || currentStep === 'password' || currentStep === 'success' ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'otp' || currentStep === 'password' || currentStep === 'success' ? 'bg-white text-green-600' : 'bg-white/20 text-white'}`}>
                  2
                </div>
                <div>
                  <p className="text-white font-semibold">Kode OTP</p>
                  <p className="text-green-100 text-sm">Masukkan 6 digit kode</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 ${currentStep === 'password' || currentStep === 'success' ? 'opacity-100' : 'opacity-50'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === 'password' || currentStep === 'success' ? 'bg-white text-green-600' : 'bg-white/20 text-white'}`}>
                  3
                </div>
                <div>
                  <p className="text-white font-semibold">Password Baru</p>
                  <p className="text-green-100 text-sm">Buat password baru</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="font-semibold text-white mb-3">Tips Keamanan:</h3>
              <ul className="space-y-2 text-green-100 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-300 font-bold">•</span>
                  <span>Gunakan password minimal 8 karakter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-300 font-bold">•</span>
                  <span>Kombinasikan huruf besar, kecil, angka, dan simbol</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-300 font-bold">•</span>
                  <span>Jangan bagikan kode OTP kepada siapapun</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Login
          </Link>

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

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            {/* Step 1: Email */}
            {currentStep === 'email' && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Lupa Password
                  </h2>
                  <p className="text-gray-600">
                    Masukkan email Anda untuk menerima kode verifikasi
                  </p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        Mengirim...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Kirim Kode OTP
                      </span>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: OTP */}
            {currentStep === 'otp' && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Verifikasi OTP
                  </h2>
                  <p className="text-gray-600">
                    Masukkan 6 digit kode OTP yang dikirim ke <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                      Kode OTP
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        required
                        maxLength={6}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 text-center text-2xl font-bold tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <strong>Catatan:</strong> Kode OTP berlaku selama 10 menit
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Tidak menerima kode? Kirim ulang
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep('email')}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-700"
                  >
                    Ganti email
                  </button>
                </form>
              </>
            )}

            {/* Step 3: New Password */}
            {currentStep === 'password' && (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Password Baru
                  </h2>
                  <p className="text-gray-600">
                    Buat password baru yang kuat dan aman
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password Baru
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Minimal 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Ulangi password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? 'Menyimpan...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}

            {/* Step 4: Success */}
            {currentStep === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Password Berhasil Direset! ✓
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Password Anda telah berhasil direset. Sekarang Anda dapat login menggunakan password baru.
                </p>
                <Link
                  href="/login"
                  className="inline-block w-full py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition text-center"
                >
                  Login Sekarang
                </Link>
              </div>
            )}
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <Link href="/about" className="hover:text-green-600 transition-colors">
                Tentang
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/privacy" className="hover:text-green-600 transition-colors">
                Privacy
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/terms" className="hover:text-green-600 transition-colors">
                Terms
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