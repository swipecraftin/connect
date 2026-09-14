import React from 'react';

interface KeyboardShortcutBarProps {
  selectionLabel?: string;
  onPostSlot?: () => void;
  onFocusSearch?: () => void;
}

export const KeyboardShortcutBar: React.FC<KeyboardShortcutBarProps> = ({
  selectionLabel,
}) => {
  return (
    <div className="fixed left-0 right-0 bottom-0 z-20 backdrop-blur-xl bg-[#07090E]/85 border-t border-white/[0.08] shadow-[0_-4px_24px_rgba(0,0,0,0.4)] hidden sm:block">
      <div className="max-w-[1320px] mx-auto px-6 py-2.5 flex items-center gap-4 flex-wrap text-xs">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.09em] text-[#4E535C] font-semibold">
          Keyboard
        </span>

        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#8A8F9C]">
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-white/[0.08] bg-[#0C0E13] text-[#AEB5C2]">
            /
          </kbd>
          search
        </span>

        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#8A8F9C]">
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-white/[0.08] bg-[#0C0E13] text-[#AEB5C2]">
            J
          </kbd>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-white/[0.08] bg-[#0C0E13] text-[#AEB5C2]">
            K
          </kbd>
          cycle slots
        </span>

        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#8A8F9C]">
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-[#3e8bff]/40 bg-[#3e8bff]/10 text-[#9cc0ff] font-semibold">
            B
          </kbd>
          request practice
        </span>

        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#8A8F9C]">
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-white/[0.08] bg-[#0C0E13] text-[#AEB5C2]">
            V
          </kbd>
          toggle density
        </span>

        <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#8A8F9C]">
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] border border-white/[0.08] bg-[#0C0E13] text-[#AEB5C2]">
            N
          </kbd>
          post a slot
        </span>

        <div className="flex-1" />

        {selectionLabel && (
          <span className="font-mono text-[10.5px] text-[#61666F]">
            {selectionLabel}
          </span>
        )}
      </div>
    </div>
  );
};
