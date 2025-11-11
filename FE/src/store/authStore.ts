// src/store/authStore.ts
import { create } from 'zustand';
import api from '@/lib/api'; // Pastikan path ini benar

// --- Interface ---
interface UserAddress { // Definisikan tipe untuk alamat jika belum ada
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

interface UserBusinessInfo { // Definisikan tipe untuk info bisnis
  businessName?: string;
  businessType?: string;
  certification?: string;
  // Tambahkan field lain jika ada di model User.js
}

interface User {
  id: string; // atau _id tergantung backend
  name: string;
  email: string;
  role: 'public' | 'mitra' | 'admin';
  phone?: string;
  points?: number;
  badge?: string;
  address?: UserAddress; // Gunakan tipe yang sudah didefinisikan
  businessInfo?: UserBusinessInfo; // Gunakan tipe yang sudah didefinisikan
}

// Tipe data yang dikirim untuk update business info
interface BusinessInfoData {
  businessName: string;
  businessType: string;
  // Tambahkan field lain jika perlu
}

// Tipe data yang dikirim untuk update profile
interface ProfileData {
  name?: string;
  phone?: string;
  address?: UserAddress;
  // Tambahkan field lain jika endpoint /updatedetails menerimanya
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<void>; // Perjelas tipe data
  updateBusinessInfo: (data: BusinessInfoData) => Promise<void>; // Tambahkan fungsi baru
}

// --- Implementasi Store ---
export const useAuthStore = create<AuthState>((set, get) => ({ // Tambahkan 'get'
  user: null,
  token: null,
  // Default isLoading: true (Sudah benar)
  isLoading: true, 
  isAuthenticated: false,

  // Fungsi Login (Sudah benar)
  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const { data } = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('token', data.token);
      // Simpan user sebagai string JSON
      localStorage.setItem('user', JSON.stringify(data.user)); 
      
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      console.error("Login Error:", error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Login gagal');
    }
  },

  // Fungsi Register (Sudah benar)
  register: async (userData) => {
    try {
      set({ isLoading: true });
      const { data } = await api.post('/auth/register', userData);
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      console.error("Register Error:", error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Registrasi gagal');
    }
  },

  // Fungsi Logout (Sudah benar)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Hapus header Authorization default dari Axios (opsional tapi baik)
    delete api.defaults.headers.common['Authorization']; 
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false, // Set false saat logout
    });
  },

  // Fungsi CheckAuth (Sudah diperbaiki untuk isLoading)
  checkAuth: async () => {
    set({ isLoading: true }); // Selalu set true di awal

    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, user: null, token: null });
      return;
    }

    try {
      // Set header sementara untuk request /me (jika interceptor belum jalan)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
      
      // Ambil data user terbaru dari backend
      const { data } = await api.get('/auth/me');
      
      // Ambil data user dari localStorage sebagai fallback
      const storedUserString = localStorage.getItem('user');
      const storedUser = storedUserString ? JSON.parse(storedUserString) : null;
      
      // Prioritaskan data dari /me, jika tidak ada baru pakai localStorage
      const currentUser = data.data || storedUser; 

      // Update localStorage jika data dari /me berbeda (opsional)
      if (data.data && JSON.stringify(data.data) !== storedUserString) {
          localStorage.setItem('user', JSON.stringify(data.data));
      }

      set({
        user: currentUser, 
        token,
        isAuthenticated: true,
        isLoading: false, // Set false saat berhasil
      });
    } catch (error: any) {
      console.error("CheckAuth Error:", error.response?.data?.error || error.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false, // Set false saat error
      });
    }
  },

  // Fungsi Update Profile (Sudah benar)
  updateProfile: async (profileData) => {
    try {
      // Endpoint backend sudah benar: /auth/updatedetails
      const { data } = await api.put('/auth/updatedetails', profileData);
      
      // Update state user dengan data baru dari response
      set({ user: data.data }); 
      // Update juga localStorage
      localStorage.setItem('user', JSON.stringify(data.data));
    } catch (error: any) {
      console.error("Update Profile Error:", error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Update profil gagal');
    }
  },

  // --- FUNGSI BARU: Update Business Info ---
  updateBusinessInfo: async (businessData) => {
    try {
      // Endpoint backend sudah benar: /auth/updatebusiness
      // Kirim data dalam format { businessInfo: {...} }
      const { data } = await api.put('/auth/updatebusiness', { businessInfo: businessData });
      
      // Update user state di store
      // Gunakan get() untuk merge state lama dan baru
      const currentUser = get().user; 
      if (currentUser) {
         // Pastikan backend mengembalikan user object lengkap di data.data
         const updatedUser = { ...currentUser, businessInfo: data.data.businessInfo };
         set({ user: updatedUser });
         localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
         // Fallback jika currentUser null (seharusnya tidak terjadi)
         set({ user: data.data });
         localStorage.setItem('user', JSON.stringify(data.data));
      }

    } catch (error: any) {
      console.error("Update Business Info Error:", error.response?.data?.error || error.message);
      throw new Error(error.response?.data?.error || 'Update info usaha gagal');
    }
  },
}));

// Panggil checkAuth sekali saat aplikasi dimuat (opsional, tergantung setup aplikasi Anda)
// useAuthStore.getState().checkAuth();