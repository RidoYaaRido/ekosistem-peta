// src/components/dashboard/UpdatePasswordForm.tsx
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function UpdatePasswordForm() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Password baru tidak cocok!');
      return;
    }
    
    toast.loading('Mengubah password...');
    // TODO: Panggil fungsi changePassword dari authStore
    // try {
    //   await changePassword(passwords.currentPassword, passwords.newPassword);
    //   toast.dismiss();
    //   toast.success('Password berhasil diubah!');
    //   setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    // } catch (error: any) {
    //   toast.dismiss();
    //   toast.error(error.message || 'Gagal mengubah password');
    // }

    // Simulasi
    setTimeout(() => {
      toast.dismiss();
      toast.success('Password berhasil diubah! (Simulasi)');
      console.log('Data Password:', passwords);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader
          title="Ubah Password"
          description="Pastikan Anda menggunakan password yang kuat."
        />
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
            <input
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handleChange}
              required
              className="w-full text-gray-800 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              required
              className="w-full text-gray-800 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              required
              className="w-full text-gray-800 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </CardContent>
        <CardFooter className="text-right">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Ubah Password
          </button>
        </CardFooter>
      </Card>
    </form>
  );
}