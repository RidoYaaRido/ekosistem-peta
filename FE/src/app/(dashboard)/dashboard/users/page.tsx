// src/app/(dashboard)/dashboard/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Plus } from 'lucide-react';
import UserTable from '@/components/dashboard/UserTable';
import EditUserModal from '@/components/dashboard/EditUserModal';
import AddUserModal from '@/components/dashboard/AddUserModal';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Interface yang Sesuai dengan backend Supabase
interface User {
  id: string;
  name: string;
  email: string;
  role: 'public' | 'mitra' | 'admin';
  is_active: boolean;
  created_at: string;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // State untuk Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'public' | 'mitra' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.data);
      setFilteredUsers(data.data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.error || 'Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // useEffect untuk menjalankan filter
  useEffect(() => {
    let filtered = [...users];

    // Search by name or email
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status (menggunakan is_active)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, statusFilter, users]);

  // --- Handlers ---
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleUserUpdated = () => {
    fetchUsers(); // Refresh data
  };
  
  const handleUserAdded = () => {
    fetchUsers(); // Refresh data
    setIsAddModalOpen(false);
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus user ${user.name}?`)) {
      try {
        await api.delete(`/admin/users/${user.id}`);
        toast.success('User berhasil dihapus');
        fetchUsers(); // Refresh data
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Gagal menghapus user');
      }
    }
  };

  const handleRefresh = () => {
    fetchUsers();
    toast.success('Data diperbarui');
  };

  // --- Stats ---
  const getStatsCount = () => {
    const totalUsers = users.length;
    const totalPublic = users.filter(u => u.role === 'public').length;
    const totalMitra = users.filter(u => u.role === 'mitra').length;
    const totalAdmin = users.filter(u => u.role === 'admin').length;
    const totalActive = users.filter(u => u.is_active).length; // Diperbaiki ke is_active

    return { totalUsers, totalPublic, totalMitra, totalAdmin, totalActive };
  };

  const stats = getStatsCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola Pengguna</h1>
          <p className="text-gray-600 mt-1">Kelola semua pengguna di sistem</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center text-gray-600 gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah User</span>
          </button>
        </div>
      </div>

      {/* PERBAIKAN: Ini adalah JSX untuk Stats Cards yang hilang */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total User</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Public</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalPublic}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Mitra</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalMitra}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Admin</p>
          <p className="text-2xl font-bold text-red-600">{stats.totalAdmin}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Aktif</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalActive}</p>
        </div>
      </div>

      {/* PERBAIKAN: Ini adalah JSX untuk Search & Filters yang hilang */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-gray-800 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full text-gray-800 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Semua Role</option>
              <option value="public">Public</option>
              <option value="mitra">Mitra</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-gray-800 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Active Filters Info */}
        {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>
              Menampilkan {filteredUsers.length} dari {users.length} pengguna
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="text-green-600 hover:text-green-700 font-medium ml-2"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Tidak ada pengguna yang sesuai dengan filter'
              : 'Belum ada pengguna terdaftar'}
          </p>
        </div>
      ) : (
        <UserTable 
          users={filteredUsers} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      )}

      {/* Modal-modal */}
      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUserUpdated={handleUserUpdated}
      />
      
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}