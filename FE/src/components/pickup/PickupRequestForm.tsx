// src/components/pickup/PickupRequestForm.tsx
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Calendar, MapPin, Package, Phone, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import LocationPickerMap secara dinamis
const LocationPickerMapDynamic = dynamic(
  () => import('@/components/map/LocationPickerMap'),
  { ssr: false, loading: () => <p>Memuat peta...</p> }
);

interface PickupRequestFormProps {
  locationId: string;
  onSuccess: () => void;
}

interface WasteCategory {
  id: string;
  name: string;
  points_per_kg: number;
}

interface WasteItem {
  category_id: string;
  estimated_weight: number;
  unit: string;
}

export default function PickupRequestForm({ locationId, onSuccess }: PickupRequestFormProps) {
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    scheduled_date: '',
    time_slot: 'morning' as 'morning' | 'afternoon' | 'evening',
    pickup_address: {
      street: '',
      city: '',
      province: '',
      latitude: null as number | null,
      longitude: null as number | null,
      notes: ''
    },
    user_notes: ''
  });

  useEffect(() => {
    fetchWasteCategories();
    
    // Set minimal date untuk besok
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, scheduled_date: minDate }));
  }, []);

  const fetchWasteCategories = async () => {
    try {
      const { data } = await api.get('/waste-categories');
      setCategories(data.data || []);
      
      // Inisialisasi dengan 1 item kosong
      if (data.data && data.data.length > 0) {
        setWasteItems([{
          category_id: data.data[0].id,
          estimated_weight: 0,
          unit: 'kg'
        }]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Gagal memuat kategori sampah');
    }
  };

  const handleLocationSelect = (data: any) => {
    setFormData(prev => ({
      ...prev,
      pickup_address: {
        ...prev.pickup_address,
        street: data.address?.street || prev.pickup_address.street,
        city: data.address?.city || prev.pickup_address.city,
        province: data.address?.province || prev.pickup_address.province,
        latitude: data.coordinates[1],
        longitude: data.coordinates[0]
      }
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('pickup_address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pickup_address: { ...prev.pickup_address, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addWasteItem = () => {
    if (categories.length === 0) return;
    
    setWasteItems([...wasteItems, {
      category_id: categories[0].id,
      estimated_weight: 0,
      unit: 'kg'
    }]);
  };

  const removeWasteItem = (index: number) => {
    if (wasteItems.length === 1) {
      toast.error('Minimal 1 jenis sampah harus dipilih');
      return;
    }
    setWasteItems(wasteItems.filter((_, i) => i !== index));
  };

  const updateWasteItem = (index: number, field: keyof WasteItem, value: any) => {
    setWasteItems(wasteItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const calculateEstimatedPoints = () => {
    return wasteItems.reduce((total, item) => {
      const category = categories.find(c => c.id === item.category_id);
      if (category) {
        return total + (item.estimated_weight * category.points_per_kg);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!formData.phone.trim()) {
      toast.error('Nomor telepon harus diisi');
      return;
    }

    if (!formData.scheduled_date) {
      toast.error('Tanggal penjemputan harus dipilih');
      return;
    }

    if (!formData.pickup_address.street.trim() || !formData.pickup_address.city.trim()) {
      toast.error('Alamat lengkap harus diisi');
      return;
    }

    if (!formData.pickup_address.latitude || !formData.pickup_address.longitude) {
      toast.error('Silakan pilih lokasi dari peta');
      return;
    }

    if (wasteItems.some(item => item.estimated_weight <= 0)) {
      toast.error('Berat sampah harus lebih dari 0');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(formData.scheduled_date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < tomorrow) {
      toast.error('Tanggal penjemputan minimal besok');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Mengirim permintaan...');

    try {
      const payload = {
        location_id: locationId,
        waste_items: wasteItems,
        pickup_address: formData.pickup_address,
        scheduled_date: formData.scheduled_date,
        time_slot: formData.time_slot,
        user_notes: formData.user_notes,
        phone: formData.phone
      };

      await api.post('/pickups', payload);
      
      toast.success('Permintaan penjemputan berhasil dibuat!', { id: toastId });
      onSuccess();
    } catch (error: any) {
      console.error('Error creating pickup:', error);
      toast.error(
        error.response?.data?.error || 'Gagal membuat permintaan',
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    { value: 'morning', label: 'Pagi (08:00 - 12:00)' },
    { value: 'afternoon', label: 'Siang (12:00 - 16:00)' },
    { value: 'evening', label: 'Sore (16:00 - 18:00)' }
  ];

  const estimatedPoints = calculateEstimatedPoints();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Kontak */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Phone className="w-4 h-4 inline mr-1" />
          Nomor Telepon <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
          placeholder="08123456789"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Nomor yang dapat dihubungi saat penjemputan
        </p>
      </div>

      {/* Jadwal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Tanggal Penjemputan <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="scheduled_date"
            value={formData.scheduled_date}
            onChange={handleInputChange}
            min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waktu Penjemputan <span className="text-red-500">*</span>
          </label>
          <select
            name="time_slot"
            value={formData.time_slot}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
            required
          >
            {timeSlots.map(slot => (
              <option key={slot.value} value={slot.value}>{slot.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Peta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4 inline mr-1" />
            Pilih Lokasi Penjemputan dari Peta <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            {showMap ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
          </button>
        </div>

        {showMap && (
          <div className="h-[350px] rounded-lg overflow-hidden border-2 border-gray-300">
            <LocationPickerMapDynamic
              onLocationSelect={handleLocationSelect}
              initialCoordinates={
                formData.pickup_address.longitude && formData.pickup_address.latitude
                  ? [formData.pickup_address.longitude, formData.pickup_address.latitude]
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Alamat */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alamat Lengkap <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pickup_address.street"
            value={formData.pickup_address.street}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
            placeholder="Otomatis terisi dari peta atau isi manual"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kota <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pickup_address.city"
              value={formData.pickup_address.city}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provinsi
            </label>
            <input
              type="text"
              name="pickup_address.province"
              value={formData.pickup_address.province}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan Alamat (Patokan, dll)
          </label>
          <textarea
            name="pickup_address.notes"
            value={formData.pickup_address.notes}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
            placeholder="Contoh: Rumah cat hijau, sebelah Indomaret"
          />
        </div>

        {formData.pickup_address.latitude && formData.pickup_address.longitude && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-medium text-green-800">✅ Koordinat dipilih:</p>
            <p className="text-sm text-green-900 font-mono">
              {formData.pickup_address.latitude.toFixed(6)}, {formData.pickup_address.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Jenis Sampah */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            <Package className="w-4 h-4 inline mr-1" />
            Jenis Sampah <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addWasteItem}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            + Tambah Item
          </button>
        </div>

        <div className="space-y-3">
          {wasteItems.map((item, index) => (
            <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border">
              <div className="flex-1">
                <select
                  value={item.category_id}
                  onChange={(e) => updateWasteItem(index, 'category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 mb-2"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.points_per_kg} poin/kg)
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={item.estimated_weight}
                    onChange={(e) => updateWasteItem(index, 'estimated_weight', parseFloat(e.target.value) || 0)}
                    min="0.1"
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                    placeholder="Berat"
                    required
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateWasteItem(index, 'unit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  >
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              {wasteItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeWasteItem(index)}
                  className="mt-1 text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Hapus
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Estimasi Poin */}
      {estimatedPoints > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            <strong>Estimasi Poin:</strong> ~{Math.round(estimatedPoints)} poin
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Poin aktual akan dihitung saat penjemputan selesai berdasarkan berat yang ditimbang
          </p>
        </div>
      )}

      {/* Catatan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catatan Tambahan
        </label>
        <textarea
          name="user_notes"
          value={formData.user_notes}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
          placeholder="Informasi tambahan untuk petugas penjemputan..."
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onSuccess}
          className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          disabled={isSubmitting}
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Permintaan'
          )}
        </button>
      </div>
    </form>
  );
}