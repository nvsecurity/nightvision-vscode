import React from 'react';

interface ChipProps {
  text: string;
  onDelete?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  text,
  onDelete,
}) => {
  return (
    <div id="chip" className="relative rounded-md flex bg-slate-600 py-0.5 pl-2.5 pr-2.5 border border-transparent text-sm text-zinc-300 transition-all shadow-sm w-unset max-w-fit items-center gap-2 overflow-auto">
      <span className='truncate leading-4'>{text}</span>

      {onDelete && (
        <button
          onClick={() => onDelete()}
          className="flex items-center justify-center transition-all p-0 text-zinc-300 hover:bg-white/10 active:bg-white/10 rounded !bg-transparent w-3.5 h-3.5 !outline-offset-1"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
};