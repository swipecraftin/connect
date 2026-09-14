import React, { useState, useEffect, useMemo } from 'react';
import { useTimezone } from '../context/TimezoneContext';
import { Calendar, Clock, Check, Globe } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // ISO string
  onChange: (isoString: string) => void;
  minMinutesInAdvance?: number;
}

interface DayOption {
  date: Date;
  isoDateString: string; // YYYY-MM-DD
  dayLabel: string; // 'Today', 'Tomorrow', 'Wed', etc.
  dayNumber: number; // 14
  monthLabel: string; // 'Sep'
  weekday: string; // 'Monday'
  isToday: boolean;
  isTomorrow: boolean;
}

const COMMON_TIME_PRESETS = [
  // Evening tech mock interview slots (prime time)
  { label: '6:00 PM', hour: 18, minute: 0, tag: 'Evening' },
  { label: '6:30 PM', hour: 18, minute: 30, tag: 'Evening' },
  { label: '7:00 PM', hour: 19, minute: 0, tag: 'Evening' },
  { label: '7:30 PM', hour: 19, minute: 30, tag: 'Prime' },
  { label: '8:00 PM', hour: 20, minute: 0, tag: 'Prime' },
  { label: '8:30 PM', hour: 20, minute: 30, tag: 'Prime' },
  { label: '9:00 PM', hour: 21, minute: 0, tag: 'Night' },
  { label: '9:30 PM', hour: 21, minute: 30, tag: 'Night' },
  { label: '10:00 PM', hour: 22, minute: 0, tag: 'Night' },
  // Daytime slots
  { label: '10:00 AM', hour: 10, minute: 0, tag: 'Morning' },
  { label: '11:30 AM', hour: 11, minute: 30, tag: 'Morning' },
  { label: '2:00 PM', hour: 14, minute: 0, tag: 'Afternoon' },
  { label: '4:00 PM', hour: 16, minute: 0, tag: 'Afternoon' },
  { label: '5:00 PM', hour: 17, minute: 0, tag: 'Afternoon' },
];

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  minMinutesInAdvance = 15,
}) => {
  const { shortCode, timeZoneOffset } = useTimezone();

  // Generate next 7 days starting today
  const dayOptions: DayOption[] = useMemo(() => {
    const days: DayOption[] = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const isoDateString = `${year}-${month}-${day}`;

      let dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = i === 0;
      const isTomorrow = i === 1;
      if (isToday) dayLabel = 'Today';
      else if (isTomorrow) dayLabel = 'Tomorrow';

      days.push({
        date: d,
        isoDateString,
        dayLabel,
        dayNumber: d.getDate(),
        monthLabel: d.toLocaleDateString('en-US', { month: 'short' }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
        isToday,
        isTomorrow,
      });
    }
    return days;
  }, []);

  // Parse initial selected date and time or default to next convenient slot
  const initialDate = useMemo(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    // Default to today + 2 hours rounded to next 30 min
    const defaultDate = new Date();
    defaultDate.setMinutes(defaultDate.getMinutes() + 60);
    if (defaultDate.getMinutes() > 30) {
      defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0);
    } else {
      defaultDate.setMinutes(30, 0, 0);
    }
    return defaultDate;
  }, [value]);

  const [selectedDayString, setSelectedDayString] = useState<string>(() => {
    const year = initialDate.getFullYear();
    const month = String(initialDate.getMonth() + 1).padStart(2, '0');
    const day = String(initialDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [selectedHour, setSelectedHour] = useState<number>(initialDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState<number>(initialDate.getMinutes() >= 30 ? 30 : 0);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customTimeInput, setCustomTimeInput] = useState<string>(() => {
    const h = String(initialDate.getHours()).padStart(2, '0');
    const m = String(initialDate.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  // Sync state whenever selection changes
  const emitChange = (dayStr: string, hour: number, minute: number) => {
    const [y, m, d] = dayStr.split('-').map(Number);
    const target = new Date(y, m - 1, d, hour, minute, 0, 0);
    onChange(target.toISOString());
  };

  // Initial trigger if value is empty
  useEffect(() => {
    if (!value) {
      emitChange(selectedDayString, selectedHour, selectedMinute);
    }
  }, []);

  const handleSelectDay = (dayStr: string) => {
    setSelectedDayString(dayStr);
    emitChange(dayStr, selectedHour, selectedMinute);
  };

  const handleSelectTimePreset = (hour: number, minute: number) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    setCustomTimeInput(`${h}:${m}`);
    emitChange(selectedDayString, hour, minute);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomTimeInput(val);
    if (val && val.includes(':')) {
      const [h, m] = val.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        setSelectedHour(h);
        setSelectedMinute(m);
        emitChange(selectedDayString, h, m);
      }
    }
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedDayString(val);
      emitChange(val, selectedHour, selectedMinute);
    }
  };

  // Check if a time preset is in the past for the currently selected day
  const isTimePast = (hour: number, minute: number) => {
    const [y, m, d] = selectedDayString.split('-').map(Number);
    const slotTime = new Date(y, m - 1, d, hour, minute, 0, 0).getTime();
    const cutoff = Date.now() + minMinutesInAdvance * 60 * 1000;
    return slotTime < cutoff;
  };

  // Human readable preview of the selected slot
  const selectedPreview = useMemo(() => {
    if (!selectedDayString) return null;
    const [y, m, d] = selectedDayString.split('-').map(Number);
    const start = new Date(y, m - 1, d, selectedHour, selectedMinute, 0, 0);
    const end = new Date(start.getTime() + 45 * 60 * 1000);

    const dateStr = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const startTimeStr = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return {
      dateStr,
      startTimeStr,
      endTimeStr,
      isInvalid: start.getTime() < Date.now() + 5 * 60 * 1000,
    };
  }, [selectedDayString, selectedHour, selectedMinute]);

  const isPresetSelected = (hour: number, minute: number) => {
    return selectedHour === hour && selectedMinute === minute;
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#0B0D12] p-3 text-xs">
      {/* Date Selection Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium text-[#E8EAF0]">
          <Calendar className="w-3.5 h-3.5 text-[#3e8bff]" />
          <span>Select Date</span>
        </div>

        {/* Custom Date Picker Link */}
        <div className="relative flex items-center">
          <label
            htmlFor="custom-date-input"
            className="text-[11px] text-[#8A8F9C] hover:text-[#3e8bff] cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>Pick another date</span>
          </label>
          <input
            id="custom-date-input"
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={selectedDayString}
            onChange={handleCustomDateChange}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </div>
      </div>

      {/* Date Carousel Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {dayOptions.map((day) => {
          const isSelected = selectedDayString === day.isoDateString;
          return (
            <button
              key={day.isoDateString}
              type="button"
              onClick={() => handleSelectDay(day.isoDateString)}
              className={`flex-none flex flex-col items-center justify-center min-w-[54px] py-1.5 px-2 rounded-lg border transition-all select-none ${
                isSelected
                  ? 'border-[#3e8bff]/60 bg-[#3e8bff]/15 text-[#cfe0ff] shadow-[0_0_12px_rgba(62,139,255,0.2)]'
                  : 'border-white/[0.06] bg-[#0E1015] text-[#8A8F9C] hover:border-white/[0.14] hover:text-[#E8EAF0]'
              }`}
            >
              <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-[#9cc0ff]' : 'text-[#61666F]'}`}>
                {day.dayLabel}
              </span>
              <span className="font-mono text-[14px] font-bold leading-tight my-0.5">
                {day.dayNumber}
              </span>
              <span className="text-[9.5px] opacity-75">
                {day.monthLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time Selection Header */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
        <div className="flex items-center gap-1.5 font-medium text-[#E8EAF0]">
          <Clock className="w-3.5 h-3.5 text-[#34D399]" />
          <span>Start Time</span>
        </div>

        {/* Timezone Badge */}
        <span className="font-mono text-[10px] text-[#8A8F9C] flex items-center gap-1">
          <Globe className="w-3 h-3 text-[#61666F]" />
          <span>{shortCode} ({timeZoneOffset})</span>
        </span>
      </div>

      {/* Popular Time Slots Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto pr-0.5">
        {COMMON_TIME_PRESETS.map((t) => {
          const isSelected = isPresetSelected(t.hour, t.minute);
          const past = isTimePast(t.hour, t.minute);

          return (
            <button
              key={`${t.hour}-${t.minute}`}
              type="button"
              disabled={past}
              onClick={() => handleSelectTimePreset(t.hour, t.minute)}
              className={`py-1.5 px-2 rounded-md font-mono text-[11px] text-center border transition-all ${
                isSelected
                  ? 'border-[#3e8bff]/60 bg-[#3e8bff]/20 text-[#cfe0ff] font-bold shadow-xs'
                  : past
                  ? 'border-white/[0.02] bg-[#0E1015]/40 text-[#4E535C] opacity-40 cursor-not-allowed line-through'
                  : 'border-white/[0.06] bg-[#0E1015] text-[#AEB5C2] hover:border-white/[0.16] hover:text-[#F2F4F8]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Custom Exact Time Toggle & Input */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
        <button
          type="button"
          onClick={() => setIsCustomMode(!isCustomMode)}
          className="text-[11px] text-[#8A8F9C] hover:text-[#3e8bff] transition-colors"
        >
          {isCustomMode ? 'Use preset slots' : 'Set custom exact time...'}
        </button>

        {isCustomMode && (
          <input
            type="time"
            value={customTimeInput}
            onChange={handleCustomTimeChange}
            className="h-[28px] px-2 rounded-md border border-white/[0.12] bg-[#0E1015] text-[#E8EAF0] font-mono text-xs focus:outline-none focus:border-[#3e8bff]/60"
          />
        )}
      </div>

      {/* Selected Slot Summary Confirmation Banner */}
      {selectedPreview && (
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors ${
            selectedPreview.isInvalid
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-[#34D399]/30 bg-[#34D399]/10 text-[#6EE7B7]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-[#34D399]/20 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-[#34D399]" />
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-[11.5px] text-[#E8EAF0]">
                {selectedPreview.dateStr} at {selectedPreview.startTimeStr}
              </span>
              <span className="text-[10px] text-[#8A8F9C]">
                45 mins: {selectedPreview.startTimeStr} – {selectedPreview.endTimeStr} · {shortCode}
              </span>
            </div>
          </div>

          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/30 border border-white/[0.08] text-[#AEB5C2]">
            Google Meet
          </span>
        </div>
      )}
    </div>
  );
};
