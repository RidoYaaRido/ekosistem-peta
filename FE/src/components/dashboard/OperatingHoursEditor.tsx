// src/components/dashboard/OperatingHoursEditor.tsx
'use client';

import { Clock, X } from 'lucide-react';

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface OperatingHoursEditorProps {
  operatingHours: OperatingHours;
  onChange: (hours: OperatingHours) => void;
}

const dayLabels: Record<keyof OperatingHours, string> = {
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
  sunday: 'Minggu'
};

export default function OperatingHoursEditor({ 
  operatingHours, 
  onChange 
}: OperatingHoursEditorProps) {
  
  const handleTimeChange = (
    day: keyof OperatingHours, 
    field: 'open' | 'close', 
    value: string
  ) => {
    onChange({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [field]: value
      }
    });
  };

  const handleClosedToggle = (day: keyof OperatingHours) => {
    onChange({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        isClosed: !operatingHours[day].isClosed
      }
    });
  };

  const handleApplyToAll = (day: keyof OperatingHours) => {
    const sourceHours = operatingHours[day];
    const newHours = { ...operatingHours };
    
    Object.keys(newHours).forEach((key) => {
      newHours[key as keyof OperatingHours] = {
        open: sourceHours.open,
        close: sourceHours.close,
        isClosed: sourceHours.isClosed
      };
    });
    
    onChange(newHours);
  };

  const handleSetWeekdays = () => {
    const newHours = { ...operatingHours };
    const weekdays: (keyof OperatingHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    weekdays.forEach(day => {
      newHours[day] = {
        open: '08:00',
        close: '17:00',
        isClosed: false
      };
    });
    
    // Weekend tutup
    newHours.saturday = { open: '08:00', close: '17:00', isClosed: true };
    newHours.sunday = { open: '08:00', close: '17:00', isClosed: true };
    
    onChange(newHours);
  };

  const handleSet24Hours = () => {
    const newHours = { ...operatingHours };
    
    Object.keys(newHours).forEach((key) => {
      newHours[key as keyof OperatingHours] = {
        open: '00:00',
        close: '23:59',
        isClosed: false
      };
    });
    
    onChange(newHours);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" /> Jam Operasional
        </h3>
        
        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSetWeekdays}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
          >
            Senin-Jumat (08:00-17:00)
          </button>
          <button
            type="button"
            onClick={handleSet24Hours}
            className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition"
          >
            Buka 24 Jam
          </button>
        </div>
      </div>

      <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
        {(Object.keys(operatingHours) as Array<keyof OperatingHours>).map((day) => (
          <div 
            key={day} 
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              operatingHours[day].isClosed 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-white border border-gray-200'
            }`}
          >
            {/* Day Label */}
            <div className="w-24 flex-shrink-0">
              <span className="font-medium text-sm text-gray-700">
                {dayLabels[day]}
              </span>
            </div>

            {/* Closed Toggle */}
            <label className="flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={operatingHours[day].isClosed}
                onChange={() => handleClosedToggle(day)}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
              />
              <span className="text-xs text-gray-600">Tutup</span>
            </label>

            {/* Time Inputs */}
            {!operatingHours[day].isClosed ? (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={operatingHours[day].open}
                    onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 w-28"
                  />
                  <span className="text-gray-500 text-sm">-</span>
                  <input
                    type="time"
                    value={operatingHours[day].close}
                    onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 w-28"
                  />
                </div>

                {/* Apply to All Button */}
                <button
                  type="button"
                  onClick={() => handleApplyToAll(day)}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition flex-shrink-0"
                  title="Terapkan ke semua hari"
                >
                  Terapkan ke Semua
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center">
                <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                  <X className="w-4 h-4" /> Tutup
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="font-medium text-blue-800 mb-1">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Centang "Tutup" untuk hari libur</li>
          <li>Gunakan "Terapkan ke Semua" untuk menyalin jam ke hari lain</li>
          <li>Gunakan tombol quick action untuk pengaturan cepat</li>
        </ul>
      </div>
    </div>
  );
}