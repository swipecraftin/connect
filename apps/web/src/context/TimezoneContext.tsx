import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  detectUserTimezone,
  getTimezoneOffsetString,
  getTimezoneShortCode,
  formatSlotDateTime,
  getTimeUntilSlot,
  TimeUntilResult,
} from '../lib/timezone';

interface TimezoneContextType {
  timeZone: string;
  detectedTimeZone: string;
  timeZoneOffset: string;
  shortCode: string;
  setTimeZone: (tz: string) => void;
  resetToDetected: () => void;
  formatSlot: (isoString: string) => string;
  getCountdown: (isoString: string) => TimeUntilResult;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'peermock_user_timezone';

export const TimezoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const detectedTimeZone = detectUserTimezone();

  const [timeZone, setTimeZoneState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return saved;
    }
    return detectedTimeZone;
  });

  const [timeZoneOffset, setTimeZoneOffset] = useState<string>(() =>
    getTimezoneOffsetString(timeZone)
  );
  const [shortCode, setShortCode] = useState<string>(() =>
    getTimezoneShortCode(timeZone)
  );

  useEffect(() => {
    setTimeZoneOffset(getTimezoneOffsetString(timeZone));
    setShortCode(getTimezoneShortCode(timeZone));
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, timeZone);
    }
  }, [timeZone]);

  const setTimeZone = (tz: string) => {
    setTimeZoneState(tz);
  };

  const resetToDetected = () => {
    setTimeZoneState(detectedTimeZone);
  };

  const formatSlot = (isoString: string) => {
    return formatSlotDateTime(isoString, timeZone);
  };

  const getCountdown = (isoString: string) => {
    return getTimeUntilSlot(isoString, timeZone);
  };

  return (
    <TimezoneContext.Provider
      value={{
        timeZone,
        detectedTimeZone,
        timeZoneOffset,
        shortCode,
        setTimeZone,
        resetToDetected,
        formatSlot,
        getCountdown,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
};

export const useTimezone = (): TimezoneContextType => {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};
