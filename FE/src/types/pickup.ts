export type PickupStatus = 
  | 'pending' 
  | 'accepted' 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export type UnitType = 'kg' | 'pcs' | 'liter';

// Interface untuk Waste Category
export interface WasteCategory {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  points_per_kg: number;
  is_active: boolean;
}

// Interface untuk Waste Item dalam Pickup
export interface PickupWasteItem {
  id?: string;
  pickup_id?: string;
  category_id: string;
  category?: WasteCategory;
  estimated_weight: number;
  actual_weight?: number | null;
  unit: UnitType;
  created_at?: string;
}

// Interface untuk User (minimal info)
export interface PickupUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// Interface untuk Location (minimal info)
export interface PickupLocation {
  id: string;
  name: string;
  type: 'bank_sampah' | 'jasa_angkut' | 'both';
  phone: string;
  street?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

// Interface untuk Pickup Request lengkap
export interface PickupRequest {
  id: string;
  user_id: string;
  location_id: string;
  status: PickupStatus;
  scheduled_date: string;
  time_slot: TimeSlot;
  
  // Address
  pickup_street: string;
  pickup_city: string;
  pickup_province?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_notes?: string;
  
  // Weight & Points
  estimated_total_weight?: number;
  actual_total_weight?: number;
  estimated_points: number;
  actual_points?: number;
  points_awarded: boolean;
  
  // Completion details
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  
  // Photos
  before_photos?: string[];
  after_photos?: string[];
  
  // Notes
  driver_notes?: string | null;
  user_notes?: string | null;
  
  // Relations
  user?: PickupUser;
  location?: PickupLocation;
  waste_items?: PickupWasteItem[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Interface untuk Create Pickup Request (form data)
export interface CreatePickupRequest {
  location_id: string;
  scheduled_date: string;
  time_slot: TimeSlot;
  pickup_address: {
    street: string;
    city: string;
    province?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  };
  waste_items: {
    category_id: string;
    estimated_weight: number;
    unit: UnitType;
  }[];
  user_notes?: string;
}

// Interface untuk Update Status
export interface UpdatePickupStatus {
  status: PickupStatus;
  driver_notes?: string;
  actual_weight_items?: {
    category_id: string;
    actual_weight: number;
  }[];
  photos?: string[];
}

// Interface untuk Pickup Statistics
export interface PickupStats {
  total: number;
  pending: number;
  accepted: number;
  scheduled: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total_weight: number;
  total_points_earned: number;
}

// Helper function untuk mendapatkan label status
export const getStatusLabel = (status: PickupStatus): string => {
  const labels: Record<PickupStatus, string> = {
    pending: 'Menunggu Konfirmasi',
    accepted: 'Diterima Mitra',
    scheduled: 'Dijadwalkan',
    in_progress: 'Dalam Perjalanan',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  };
  return labels[status];
};

// Helper function untuk mendapatkan warna status
export const getStatusColor = (status: PickupStatus): string => {
  const colors: Record<PickupStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    accepted: 'bg-blue-100 text-blue-800 border-blue-300',
    scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
    in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300'
  };
  return colors[status];
};

// Helper function untuk format time slot
export const getTimeSlotLabel = (slot: TimeSlot): string => {
  const labels: Record<TimeSlot, string> = {
    morning: 'Pagi (08:00 - 12:00)',
    afternoon: 'Siang (12:00 - 16:00)',
    evening: 'Sore (16:00 - 18:00)'
  };
  return labels[slot];
};

// Helper function untuk validasi pickup dapat dibatalkan
export const canCancelPickup = (status: PickupStatus): boolean => {
  return ['pending', 'accepted', 'scheduled'].includes(status);
};

// Helper function untuk validasi pickup dapat diupdate oleh mitra
export const canUpdatePickup = (status: PickupStatus, newStatus: PickupStatus): boolean => {
  const validTransitions: Record<PickupStatus, PickupStatus[]> = {
    pending: ['accepted', 'cancelled'],
    accepted: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  
  return validTransitions[status]?.includes(newStatus) || false;
};