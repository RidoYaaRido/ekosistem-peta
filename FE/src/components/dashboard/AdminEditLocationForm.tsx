// src/components/dashboard/AdminEditLocationForm.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import OperatingHoursEditor, { OperatingHours } from '@/components/dashboard/OperatingHoursEditor';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, Phone, Package, Shield, LocateFixed, Map } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Location } from '@/types';

interface AdminEditLocationFormProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LocationPickerMapDynamic = dynamic(() => import('@/components/map/LocationPickerMap'), {
  ssr: false,
  loading: () => <p>Memuat peta...</p>
});

const defaultOperatingHours: OperatingHours = {
  monday: { open: '08:00', close: '17:00', isClosed: false },
  tuesday: { open: '08:00', close: '17:00', isClosed: false },
  wednesday: { open: '08:00', close: '17:00', isClosed: false },
  thursday: { open: '08:00', close: '17:00', isClosed: false },
  friday: { open: '08:00', close: '17:00', isClosed: false },
  saturday: { open: '08:00', close: '17:00', isClosed: false },
  sunday: { open: '08:00', close: '17:00', isClosed: true }
};

export default function AdminEditLocationForm({ location, isOpen, onClose, onSuccess }: AdminEditLocationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank_sampah' as 'bank_sampah' | 'jasa_angkut',
    description: '',
    address: { street: '', city: '', province: '', postalCode: '' },
    location: { coordinates: ['', ''] as [string, string] },
    contact: { phone: '', email: '', whatsapp: '' },
    services: [] as string[],
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'suspended',
    isVerified: false,
    operatingHours: defaultOperatingHours
  });

  useEffect(() => {
    if (!isOpen) {
      setShowMap(false);
    }
  }, [isOpen]);

  const locationTypes = [
    { value: 'bank_sampah', label: 'Bank Sampah' },
    { value: 'jasa_angkut', label: 'Jasa Angkut Sampah' }
  ];

  const serviceOptions = [
    { value: 'pickup', label: 'Penjemputan' },
    { value: 'dropoff', label: 'Antar Sendiri (Drop-off)' },
  ];

  // Membaca data "datar" dari props
  useEffect(() => {
    if (location && isOpen) {
      const services = [];
      if (location.pickup_service) services.push('pickup');
      if (location.dropoff_service) services.push('dropoff');

      const longitude = location.longitude || 0;
      const latitude = location.latitude || 0;

      setFormData({
        name: location.name || '',
        type: location.type || 'bank_sampah',
        description: location.description || '',
        address: {
          street: location.street || '',
          city: location.city || '',
          province: location.province || '',
          postalCode: location.postal_code || ''
        },
        location: {
          coordinates: [ longitude.toString(), latitude.toString() ]
        },
        contact: {
          phone: location.phone || '',
          email: location.email || '',
          whatsapp: location.website || '' // 'website' di DB
        },
        services: services,
        status: location.status || 'pending',
        isVerified: location.verified || false,
        //isActive: location.is_active !== undefined ? location.is_active : true,
        operatingHours: location.operating_hours || location.operatingHours || defaultOperatingHours
      });
    }
  }, [location, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, [field]: value }
      }));
    } else if (name === 'longitude' || name === 'latitude') {
      const index = name === 'longitude' ? 0 : 1;
      const newCoordinates: [string, string] = [...formData.location.coordinates] as [string, string];
      newCoordinates[index] = value;
      setFormData(prev => ({
        ...prev,
        location: { coordinates: newCoordinates }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value as any }));
    }
  };

  const handleServiceChange = (service: string) => {
    setFormData(prev => {
      const services = prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service];
      return { ...prev, services };
    });
  };
  
  const handleOperatingHoursChange = (hours: OperatingHours) => {
    setFormData(prev => ({ ...prev, operatingHours: hours }));
  };
  
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      const toastId = toast.loading('Mengambil lokasi Anda...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: {
              coordinates: [longitude.toString(), latitude.toString()]
            }
          }));
          toast.success('Lokasi berhasil diambil', { id: toastId });
        },
        (error) => {
          toast.error('Gagal mengambil lokasi: ' + error.message, { id: toastId });
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Browser tidak mendukung geolokasi');
    }
  };
  
  const handleLocationSelect = (data: { coordinates: [number, number], address?: any }) => {
    if (data.coordinates && data.coordinates.length === 2) {
      setFormData(prev => ({
        ...prev,
        location: {
          coordinates: [data.coordinates[0].toString(), data.coordinates[1].toString()]
        },
        address: {
          street: data.address?.street || prev.address.street,
          city: data.address?.city || prev.address.city,
          province: data.address?.province || prev.address.province,
          postalCode: data.address?.postalCode || prev.address.postalCode,
        }
      }));
      setShowMap(false);
      toast.success('Koordinat dari peta berhasil diterapkan.');
    } else {
      toast.error('Data koordinat dari peta tidak valid.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;
    
    const lon = parseFloat(formData.location.coordinates[0]);
    const lat = parseFloat(formData.location.coordinates[1]);
    if (isNaN(lon) || isNaN(lat)) return toast.error('Format koordinat tidak valid');

    setIsSubmitting(true);
    const toastId = toast.loading('Menyimpan perubahan...');

    try {
      // Mengirim payload "datar"
      const payload = {
        // Admin fields
        status: formData.status,
        verified: formData.isVerified,
       // is_active: formData.isActive, // Mengirim 'is_active'
        
        // Basic info
        name: formData.name,
        type: formData.type,
        description: formData.description,
        
        // 'address'
        street: formData.address.street,
        city: formData.address.city,
        province: formData.address.province,
        postal_code: formData.address.postalCode,
        
        // 'contact'
        phone: formData.contact.phone,
        email: formData.contact.email,
        website: formData.contact.whatsapp,
        
        // 'location'
        longitude: lon,
        latitude: lat,
        
        // 'services'
        pickup_service: formData.services.includes('pickup'),
        dropoff_service: formData.services.includes('dropoff'),
        
        operating_hours: formData.operatingHours,
      };

      const locationId = location.id || location._id;
      
      await api.put(`/locations/${locationId}`, payload);
      toast.success('Lokasi berhasil diupdate!', { id: toastId });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Admin Update Location Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Gagal mengupdate lokasi', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location) return null;
  const locationId = location.id || location._id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Lokasi (Admin)" size="large">
      {showMap && (
        <div className="mb-4 border rounded-lg overflow-hidden">
          <div className="h-[400px]">
            <LocationPickerMapDynamic
              initialCoordinates={[
                parseFloat(formData.location.coordinates[1]),
                parseFloat(formData.location.coordinates[0])
              ]}
              onLocationSelect={handleLocationSelect}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowMap(false)}
            className='mt-2 ml-2 mb-2 text-sm text-red-600 hover:underline'
          >
            Tutup Peta
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
        {/* Kontrol Admin */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Kontrol Admin
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                required
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isVerified"
                  checked={formData.isVerified}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">Terverifikasi</span>
              </label>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive" // Nama field di form
                  //checked={formData.isActive} // State di form
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
            </div>
          </div>
        </div>

        {/* Informasi Dasar */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" /> Informasi Dasar
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lokasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Lokasi <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            >
              {locationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="Deskripsi singkat tentang lokasi ini..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layanan yang Tersedia <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {serviceOptions.map(service => (
                <label key={service.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.value)}
                    onChange={() => handleServiceChange(service.value)}
                    className="rounded border-gray-300 text-green-600 mr-2"
                  />
                  <span className="text-sm text-gray-700">{service.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Alamat */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Alamat
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jalan/Alamat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kota <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provinsi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address.province"
                value={formData.address.province}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Pos
            </label>
            <input
              type="text"
              name="address.postalCode"
              value={formData.address.postalCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Koordinat Lokasi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.location.coordinates[0]}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="Longitude"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Longitude</p>
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.location.coordinates[1]}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="Latitude"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Latitude</p>
              </div>
            </div>
            <div className='flex gap-4 mt-2'>
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
              >
                <Map className="w-4 h-4" /> Pilih dari Peta
              </button>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="text-sm text-green-600 hover:text-green-700 underline flex items-center gap-1"
              >
                <LocateFixed className="w-4 h-4" /> Gunakan Lokasi Saat Ini
              </button>
            </div>
          </div>
        </div>

        {/* Kontak */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5" /> Kontak
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="contact.phone"
              value={formData.contact.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="contact.email"
              value={formData.contact.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp (Format: 62...)
            </label>
            <input
              type="tel"
              name="contact.whatsapp"
              value={formData.contact.whatsapp}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            />
          </div>
        </div>

        {/* Jam Operasional */}
        <div className="pt-4 border-t">
          <OperatingHoursEditor
            operatingHours={formData.operatingHours}
            onChange={handleOperatingHoursChange}
          />
        </div>

        {/* Tombol Submit */}
        <div className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
