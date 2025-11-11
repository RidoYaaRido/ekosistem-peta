// src/components/dashboard/pickups/PickupCard.tsx
'use client';

import { Calendar, Clock, MapPin, Package, Phone, User } from 'lucide-react';
import { PickupRequest, getStatusLabel, getStatusColor, getTimeSlotLabel } from '@/types/pickup';

interface PickupCardProps {
  pickup: PickupRequest;
  onManage?: (pickup: PickupRequest) => void;
  onCancel?: (pickup: PickupRequest) => void;
  showActions?: boolean;
  variant?: 'public' | 'mitra';
}

export default function PickupCard({ 
  pickup, 
  onManage, 
  onCancel, 
  showActions = true,
  variant = 'public' 
}: PickupCardProps) {
  
  const statusColor = getStatusColor(pickup.status);
  const statusLabel = getStatusLabel(pickup.status);
  const timeSlotLabel = getTimeSlotLabel(pickup.time_slot);
  
  const formattedDate = new Date(pickup.scheduled_date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${statusColor}`}>
              {statusLabel}
            </span>
            <p className="text-xs text-gray-500 mt-2">ID: {pickup.id.split('-')[0]}...</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-gray-700">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 mt-1">
              <Clock className="w-3 h-3" />
              <span className="text-xs">{timeSlotLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Location/User Info */}
        {variant === 'public' && pickup.location && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{pickup.location.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {pickup.location.phone}
              </p>
            </div>
          </div>
        )}

        {variant === 'mitra' && pickup.user && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{pickup.user.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {pickup.user.phone}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {pickup.pickup_street}, {pickup.pickup_city}
              </p>
            </div>
          </div>
        )}

        {/* Waste Items */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">Item Sampah</h4>
          </div>
          <div className="space-y-1">
            {pickup.waste_items && pickup.waste_items.length > 0 ? (
              pickup.waste_items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{item.category?.name || 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {item.actual_weight || item.estimated_weight} {item.unit}
                    </span>
                    {item.actual_weight && (
                      <span className="text-xs text-green-600">(Aktual)</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">Tidak ada item</p>
            )}
          </div>
        </div>

        {/* Points Info */}
        {pickup.actual_points && pickup.points_awarded && (
          <div className="pt-3 border-t border-gray-100">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-semibold">+{pickup.actual_points} Poin</span> telah diberikan
              </p>
            </div>
          </div>
        )}

        {/* Cancellation Reason */}
        {pickup.status === 'cancelled' && pickup.cancellation_reason && (
          <div className="pt-3 border-t border-gray-100">
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-xs text-red-700">
                <span className="font-semibold">Alasan:</span> {pickup.cancellation_reason}
              </p>
            </div>
          </div>
        )}

        {/* User Notes */}
        {pickup.user_notes && variant === 'mitra' && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Catatan:</span> {pickup.user_notes}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
          {variant === 'mitra' && onManage && (
            <button
              onClick={() => onManage(pickup)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
            >
              Kelola Permintaan
            </button>
          )}
          
          {variant === 'public' && onCancel && ['pending', 'accepted', 'scheduled'].includes(pickup.status) && (
            <button
              onClick={() => onCancel(pickup)}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
            >
              Batalkan
            </button>
          )}
        </div>
      )}
    </div>
  );
}