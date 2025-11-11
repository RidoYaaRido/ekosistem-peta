// src/components/dashboard/transactions/MitraTransactions.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Package,
  MapPin,
  User,
  Download,
  Filter,
  Search
} from 'lucide-react';

interface Transaction {
  id: string;
  pickup_id: string;
  location_name: string;
  user_name: string;
  completed_at: string;
  actual_total_weight: number;
  actual_points: number;
  waste_items: {
    category_name: string;
    actual_weight: number;
    unit: string;
  }[];
}

export default function MitraTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalWeight: 0,
    totalPoints: 0,
    thisMonth: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [dateFilter]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch completed pickups as transactions
      const { data } = await api.get('/pickups/schedule', {
        params: { 
          status: 'completed',
          limit: 1000
        }
      });

      const completedPickups = data.data || [];
      
      // Transform to transaction format
      const transactionData: Transaction[] = completedPickups.map((pickup: any) => ({
        id: pickup.id,
        pickup_id: pickup.id,
        location_name: pickup.location?.name || 'N/A',
        user_name: pickup.user?.name || 'N/A',
        completed_at: pickup.completed_at,
        actual_total_weight: pickup.actual_total_weight || 0,
        actual_points: pickup.actual_points || 0,
        waste_items: pickup.waste_items?.map((item: any) => ({
          category_name: item.category?.name || 'N/A',
          actual_weight: item.actual_weight || 0,
          unit: item.unit || 'kg'
        })) || []
      }));

      // Apply date filter
      const filteredData = filterByDate(transactionData);
      setTransactions(filteredData);

      // Calculate stats
      calculateStats(transactionData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  const filterByDate = (data: Transaction[]) => {
    const now = new Date();
    
    return data.filter(t => {
      const completedDate = new Date(t.completed_at);
      
      switch (dateFilter) {
        case 'today':
          return completedDate.toDateString() === now.toDateString();
        
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return completedDate >= weekAgo;
        
        case 'month':
          return completedDate.getMonth() === now.getMonth() &&
                 completedDate.getFullYear() === now.getFullYear();
        
        default:
          return true;
      }
    });
  };

  const calculateStats = (data: Transaction[]) => {
    const now = new Date();
    const thisMonthData = data.filter(t => {
      const date = new Date(t.completed_at);
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    });

    setStats({
      totalTransactions: data.length,
      totalWeight: data.reduce((sum, t) => sum + t.actual_total_weight, 0),
      totalPoints: data.reduce((sum, t) => sum + t.actual_points, 0),
      thisMonth: thisMonthData.length
    });
  };

  const filteredTransactions = transactions.filter(t =>
    t.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Lokasi', 'Pelanggan', 'Total Berat (kg)', 'Poin Diberikan'];
    const rows = filteredTransactions.map(t => [
      new Date(t.completed_at).toLocaleDateString('id-ID'),
      t.location_name,
      t.user_name,
      t.actual_total_weight.toFixed(2),
      t.actual_points
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Data berhasil diexport');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Transaksi</h1>
          <p className="text-gray-600 mt-1">Kelola dan pantau semua transaksi penjemputan</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Berat</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalWeight.toFixed(1)}</p>
              <p className="text-xs text-gray-500">kg</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Poin Diberikan</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPoints}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bulan Ini</p>
              <p className="text-3xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-7 h-7 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pelanggan atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Date Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Semua' },
              { value: 'today', label: 'Hari Ini' },
              { value: 'week', label: '7 Hari' },
              { value: 'month', label: 'Bulan Ini' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                  dateFilter === filter.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Lokasi</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Pelanggan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Detail Sampah</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Total Berat</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(transaction.completed_at).toLocaleDateString('id-ID', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.completed_at).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-900">{transaction.location_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-900">{transaction.user_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {transaction.waste_items.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            {item.category_name}: {item.actual_weight} {item.unit}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {transaction.actual_total_weight.toFixed(2)} kg
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                        +{transaction.actual_points} poin
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}