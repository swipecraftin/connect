import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative flex flex-col gap-1 text-xs ${className}`} ref={containerRef}>
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A8F9C]">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-[36px] w-full px-3 rounded-lg border transition-all duration-150 flex items-center justify-between gap-2 text-left bg-[#0B0D12] select-none ${
          isOpen
            ? 'border-[#3e8bff]/60 shadow-[0_0_0_1px_rgba(62,139,255,0.2)]'
            : 'border-white/[0.08] hover:border-white/[0.16]'
        }`}
      >
        <span className={`truncate text-xs ${selectedOption ? 'text-[#E8EAF0] font-medium' : 'text-[#61666F]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8A8F9C] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#3e8bff]' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-lg border border-white/[0.12] bg-[#0E1015] shadow-[0_16px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.045)] max-h-[220px] overflow-y-auto p-1 divide-y divide-white/[0.04] animate-in fade-in zoom-in-95 duration-100">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#3e8bff]/15 text-[#cfe0ff] font-semibold'
                    : 'text-[#C6CBD5] hover:bg-white/[0.05] hover:text-[#F2F4F8]'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {opt.badge && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[#8A8F9C]">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#3e8bff]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
