'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  shortcutBadge?: string;
}

const sizeConfig = {
  sm: 'text-xs py-1.5 pl-8 pr-7 rounded-lg',
  md: 'text-xs sm:text-sm py-2 pl-9 pr-8 rounded-xl',
  lg: 'text-sm py-2.5 pl-10 pr-9 rounded-xl',
};

const iconConfig = {
  sm: 'w-3.5 h-3.5 left-2.5',
  md: 'w-4 h-4 left-3',
  lg: 'w-4 h-4 left-3.5',
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onValueChange,
      onClear,
      loading = false,
      size = 'md',
      shortcutBadge,
      placeholder = 'Search...',
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const handleClear = () => {
      onValueChange('');
      if (onClear) onClear();
    };

    return (
      <div className={`relative flex items-center w-full ${className}`}>
        {loading ? (
          <Loader2
            className={`absolute ${iconConfig[size]} text-blue-400 animate-spin pointer-events-none`}
          />
        ) : (
          <Search
            className={`absolute ${iconConfig[size]} text-slate-400 pointer-events-none`}
          />
        )}

        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full bg-white/[0.06] hover:bg-white/[0.08] focus:bg-black/40 border border-white/10 focus:border-blue-500/60 text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500/20 ${
            sizeConfig[size]
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          {...props}
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {shortcutBadge && !value && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/10 rounded border border-white/15">
              {shortcutBadge}
            </kbd>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
