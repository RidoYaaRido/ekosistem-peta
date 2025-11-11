// src/types/index.ts

export interface Location {
  id: string; 
  name: string;
  owner?: { name: string; email?: string; phone?: string };
  type: 'bank_sampah' | 'jasa_angkut';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string; 
  
  // Field "datar" (flat)
  street: string;
  city: string;
  province: string;
  postal_code?: string;
  phone: string;
  email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  
  operating_hours?: any;
  pickup_service: boolean;
  dropoff_service: boolean;
  
  // Field Admin/Edit
  rejection_reason?: string;
  verified: boolean;
  is_active: boolean; 
  
  // Field Mongoose lama (jika masih ada di data)
  _id?: string;
}
