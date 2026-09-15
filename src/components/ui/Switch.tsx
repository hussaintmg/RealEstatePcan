'use client';

import React, { forwardRef, KeyboardEvent } from 'react';
import { Loader2 } from 'lucide-react';

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    track: 'w-8 h-4',
    knob: 'w-3 h-3',
    translateOn: 'translate-x-4',
    translateOff: 'translate-x-0.5',
    text: 'text-xs',
  },
  md: {
    track: 'w-11 h-6',
    knob: 'w-5 h-5',
    translateOn: 'translate-x-5',
    translateOff: 'translate-x-0.5',
    text: 'text-xs sm:text-sm',
  },
  lg: {
    track: 'w-14 h-7',
    knob: 'w-6 h-6',
    translateOn: 'translate-x-7',
    translateOff: 'translate-x-0.5',
    text: 'text-sm sm:text-base',
  },
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      id,
      checked,
      onChange,
      label,
      description,
      disabled = false,
      loading = false,
      className = '',
      size = 'md',
    },
    ref
  ) => {
    const cfg = sizeConfig[size];
    const isDisabled = disabled || loading;

    const handleToggle = () => {
      if (!isDisabled) {
        onChange(!checked);
      }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggle();
      }
    };

    return (
      <label
        htmlFor={id}
        className={`inline-flex items-start gap-3 select-none ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <button
          ref={ref}
          id={id}
          role="switch"
          type="button"
          aria-checked={checked}
          disabled={isDisabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`relative inline-flex items-center flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0d14] ${
            cfg.track
          } ${
            checked
              ? 'bg-blue-600 shadow-md shadow-blue-600/30'
              : 'bg-white/15 hover:bg-white/20'
          }`}
        >
          <span
            className={`inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center ${
              cfg.knob
            } ${checked ? cfg.translateOn : cfg.translateOff}`}
          >
            {loading && (
              <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-600" />
            )}
          </span>
        </button>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className={`font-medium text-slate-200 ${cfg.text}`}>
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-slate-400 mt-0.5">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
