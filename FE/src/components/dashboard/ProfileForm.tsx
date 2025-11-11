// src/components/dashboard/ProfileForm.tsx
'use client';

import { useState, useEffect } from 'react';
// --- Impor fungsi update dari store ---
import { useAuthStore } from '@/store/authStore';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function ProfileForm() {
  // --- Ambil fungsi update dari store ---
  const { user, isLoading, updateProfile, updateBusinessInfo } = useAuthStore();
  
  // --- State terpisah untuk info dasar dan bisnis ---
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    province: '',
  });
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: '',
  });

  // Isi form dengan data user saat komponen dimuat
  useEffect(() => {
    if (user) {
      setBasicInfo({
        name: user.name || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        province: user.address?.province || '',
      });
      if (user.role === 'mitra' && user.businessInfo) { // Cek juga user.businessInfo
        setBusinessInfo({
          businessName: user.businessInfo.businessName || '',
          businessType: user.businessInfo.businessType || '',
        });
      }
    }
  }, [user]); // Jalankan efek saat 'user' berubah

  // Handler untuk info dasar
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBasicInfo({ ...basicInfo, [e.target.name]: e.target.value });
  };

  // Handler untuk info bisnis
  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBusinessInfo({ ...businessInfo, [e.target.name]: e.target.value });
  };

  // --- Fungsi handleSubmit untuk info dasar ---
  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Memperbarui profil...');
    
    try {
      // Siapkan data sesuai ekspektasi backend /auth/updatedetails
      const dataToSend = {
        name: basicInfo.name,
        phone: basicInfo.phone,
        address: { // Backend mengharapkan address sebagai object
          street: basicInfo.street,
          city: basicInfo.city,
          province: basicInfo.province,
        }
      };
      
      // Panggil fungsi updateProfile dari authStore
      await updateProfile(dataToSend); 
      toast.success('Profil berhasil diperbarui!', { id: toastId });
      
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui profil', { id: toastId });
      console.error("Update error:", error.response?.data || error.message); 
    }
  };

  // --- Fungsi handleSubmit untuk info bisnis (Mitra) ---
  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'mitra') return; // Hanya untuk mitra

    // Validasi sederhana (opsional)
    if (!businessInfo.businessName || !businessInfo.businessType) {
       toast.error('Nama dan Jenis Usaha harus diisi.');
       return;
    }

    const toastId = toast.loading('Memperbarui info usaha...');
    try {
      // Panggil fungsi updateBusinessInfo dari store
      await updateBusinessInfo(businessInfo); 
      
      toast.success('Info usaha berhasil diperbarui!', { id: toastId });

    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui info usaha', { id: toastId });
      console.error("Update business error:", error.response?.data || error.message);
    }
  };

  // Tampilkan loading jika data user awal belum siap
  if (isLoading || !user) {
    return (
       <div className="flex justify-center items-center h-40">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
       </div>
    );
  }

  return (
    // --- Gunakan onSubmit yang sesuai untuk setiap form ---
    <>
      {/* Form untuk Informasi Akun Dasar */}
      <form onSubmit={handleBasicSubmit}>
        <Card>
          <CardHeader
            title="Informasi Akun"
            description="Perbarui informasi kontak dan alamat Anda."
          />
          <CardContent className="space-y-4">
            {/* Input Nama & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={basicInfo.name}
                  onChange={handleBasicChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Tidak bisa diubah)</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={user.email} // Ambil langsung dari user
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>
            {/* Input Telepon */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={basicInfo.phone}
                onChange={handleBasicChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            {/* Input Alamat */}
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
              <input
                id="street"
                name="street"
                type="text"
                value={basicInfo.street}
                onChange={handleBasicChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            {/* Input Kota & Provinsi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={basicInfo.city}
                  onChange={handleBasicChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <input
                  id="province"
                  name="province"
                  type="text"
                  value={basicInfo.province}
                  onChange={handleBasicChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-right">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-70"
              disabled={isLoading} // Nonaktifkan saat loading awal
            >
              Simpan Info Akun
            </button>
          </CardFooter>
        </Card>
      </form>

      {/* Form untuk Informasi Usaha (HANYA Mitra) */}
      {user.role === 'mitra' && (
        <form onSubmit={handleBusinessSubmit}>
          <Card className="mt-8">
            <CardHeader
              title="Informasi Usaha"
              description="Perbarui detail usaha atau bank sampah Anda."
            />
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">Nama Usaha</label>
                <input
                  id="businessName"
                  type="text"
                  name="businessName"
                  value={businessInfo.businessName}
                  onChange={handleBusinessChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">Jenis Usaha</label>
                <select
                  id="businessType"
                  name="businessType"
                  value={businessInfo.businessType}
                  onChange={handleBusinessChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Pilih Jenis Usaha</option>
                  <option value="bank_sampah">Bank Sampah</option>
                  <option value="jasa_angkut">Jasa Angkut Sampah</option>
                </select>
              </div>
              {/* Tambahkan field lain untuk info bisnis jika perlu */}
            </CardContent>
            <CardFooter className="text-right">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-70"
                 disabled={isLoading} // Nonaktifkan saat loading awal
              >
                Simpan Info Usaha
              </button>
            </CardFooter>
          </Card>
        </form>
      )}
    </>
  );
}