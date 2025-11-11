// src/components/dashboard/EditLocationForm.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import OperatingHoursEditor, { OperatingHours } from '@/components/dashboard/OperatingHoursEditor';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, Phone, Package, Map, LocateFixed } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Location } from '@/types';

interface EditLocationFormProps {
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

export default function EditLocationForm({ location, isOpen, onClose, onSuccess }: EditLocationFormProps) {
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
    operatingHours: defaultOperatingHours
  });

  const locationTypes = [
    { value: 'bank_sampah', label: 'Bank Sampah' },
    { value: 'jasa_angkut', label: 'Jasa Angkut Sampah' }
  ];

  const serviceOptions = [
    { value: 'pickup', label: 'Penjemputan' },
    { value: 'dropoff', label: 'Antar Sendiri (Drop-off)' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setShowMap(false);
    }
  }, [isOpen]);

  // Membaca data "datar" dari props, mengisi ke form "bersarang"
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
        operatingHours: location.operating_hours || location.operatingHours || defaultOperatingHours
      });
    }
  }, [location, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [field]: value }
      }));
    } else if (name === 'longitude' || name === 'latitude') {
      const index = name === 'longitude' ? 0 : 1;
      const newCoordinates: [string, string] = [...formData.location.coordinates];
      newCoordinates[index] = value;
      setFormData(prev => ({
        ...prev,
        location: { coordinates: newCoordinates }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value as any }));
    }
  };

  const handleServiceChange = (serviceValue: string) => {
    setFormData(prev => {
      const currentServices = prev.services;
      const services = currentServices.includes(serviceValue)
        ? currentServices.filter(s => s !== serviceValue)
        : [...currentServices, serviceValue];
      return { ...prev, services };
    });
  };

  const handleOperatingHoursChange = (hours: OperatingHours) => {
    setFormData(prev => ({ ...prev, operatingHours: hours }));
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      const toastId = toast.loading('Mengambil lokasi saat ini...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            location: {
              coordinates: [longitude.toString(), latitude.toString()]
            }
          }));
          toast.success('Lokasi saat ini berhasil diambil', { id: toastId });
        },
        (error) => {
          toast.error(`Gagal mengambil lokasi: ${error.message}`, { id: toastId });
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Browser tidak mendukung geolokasi.');
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

  const handleSubmit = async () => {
    if (!location) return;

    // Validasi
    if (!formData.name.trim()) return toast.error('Nama lokasi harus diisi');
    if (!formData.address.street.trim()) return toast.error('Alamat jalan harus diisi');
    if (!formData.address.city.trim()) return toast.error('Kota harus diisi');
    if (!formData.address.province.trim()) return toast.error('Provinsi harus diisi');
    if (!formData.contact.phone.trim()) return toast.error('Nomor telepon harus diisi');
    if (!formData.location.coordinates[0] || !formData.location.coordinates[1]) return toast.error('Koordinat (Longitude & Latitude) harus diisi');
    if (formData.services.length === 0) return toast.error('Minimal pilih satu layanan');
    
    const lon = parseFloat(formData.location.coordinates[0]);
    const lat = parseFloat(formData.location.coordinates[1]);
    if (isNaN(lon) || lon < -180 || lon > 180) return toast.error('Format Longitude tidak valid');
    if (isNaN(lat) || lat < -90 || lat > 90) return toast.error('Format Latitude tidak valid');

    setIsSubmitting(true);
    const toastId = toast.loading('Menyimpan perubahan...');

    try {
      // Mengirim payload "datar"
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        street: formData.address.street,
        city: formData.address.city,
        province: formData.address.province,
        postal_code: formData.address.postalCode,
        phone: formData.contact.phone,
        email: formData.contact.email,
        website: formData.contact.whatsapp, // 'website' di DB
        longitude: lon,
        latitude: lat,
        pickup_service: formData.services.includes('pickup'),
        dropoff_service: formData.services.includes('dropoff'),
        operating_hours: formData.operatingHours,
      };

      const locationId = location.id || location._id;
      
      await api.put(`/locations/${locationId}`, payload);
      toast.success('Lokasi berhasil diupdate! Menunggu persetujuan admin.', { id: toastId, duration: 4000 });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Update Location Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Gagal mengupdate lokasi', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !location) return null;
  const locationId = location.id || location._id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Lokasi: ${location.name}`} size="large">
      {showMap && (
        <div className="mb-4 border rounded-lg overflow-hidden">
          <div className="h-[400px]">
            <LocationPickerMapDynamic
              initialCoordinates={[
                parseFloat(formData.location.coordinates[1]), // Peta butuh [lat, lon]
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

      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sticky top-0 z-10">
          <p className="text-sm text-yellow-800">
            <strong>Perhatian:</strong> Update lokasi akan mengubah status menjadi "Pending" dan perlu persetujuan admin.
          </p>
        </div>

        {/* Informasi Dasar */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" /> Informasi Dasar
          </h3>
          
          <div>
            <label htmlFor={`name-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lokasi <span className="text-red-500">*</span>
            </label>
            <input
              id={`name-${locationId}`}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="Contoh: Bank Sampah Sejahtera"
              required
            />
          </div>

          <div>
            <label htmlFor={`type-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Lokasi <span className="text-red-500">*</span>
            </label>
            <select
              id={`type-${locationId}`}
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
            <label htmlFor={`description-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              id={`description-${locationId}`}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="Deskripsi singkat..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layanan <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {serviceOptions.map(service => (
                <label key={service.value} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.value)}
                    onChange={() => handleServiceChange(service.value)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
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
            <MapPin className="w-5 h-5 text-gray-600" /> Alamat & Lokasi Peta
          </h3>

          <div>
            <label htmlFor={`street-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
              Jalan/Alamat <span className="text-red-500">*</span>
            </label>
            <input
              id={`street-${locationId}`}
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="Jl. Contoh No. 123"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`city-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
                Kota <span className="text-red-500">*</span>
              </label>
              <input
                id={`city-${locationId}`}
                type="text"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                placeholder="Bekasi"
                required
              />
            </div>
            <div>
              <label htmlFor={`province-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
                Provinsi <span className="text-red-500">*</span>
              </label>
              <input
                id={`province-${locationId}`}
                type="text"
                name="address.province"
                value={formData.address.province}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                placeholder="Jawa Barat"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor={`postalCode-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
              Kode Pos
            </label>
            <input
              id={`postalCode-${locationId}`}
              type="text"
              name="address.postalCode"
              value={formData.address.postalCode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="17123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Koordinat Lokasi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4 items-end">
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
            <Phone className="w-5 h-5 text-gray-600" /> Kontak
          </h3>

          <div>
            <label htmlFor={`phone-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              id={`phone-${locationId}`}
              type="tel"
              name="contact.phone"
              value={formData.contact.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="08123456789"
              required
            />
          </div>

          <div>
            <label htmlFor={`email-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id={`email-${locationId}`}
              type="email"
              name="contact.email"
              value={formData.contact.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="email@contoh.com"
            />
          </div>

          <div>
            <label htmlFor={`whatsapp-${locationId}`} className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp (Format: 62...)
            </label>
            <input
              id={`whatsapp-${locationId}`}
              type="tel"
              name="contact.whatsapp"
              value={formData.contact.whatsapp}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              placeholder="62812..."
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

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-3 pt-6 border-t mt-6 sticky bottom-0 bg-white py-4 -mb-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
