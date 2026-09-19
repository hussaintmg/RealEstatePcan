'use client';

import React, { useRef, useState, useEffect } from 'react';

export interface SixBoxOtpInputProps {
  length?: number;
  value?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export const SixBoxOtpInput: React.FC<SixBoxOtpInputProps> = ({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}) => {
  const [digits, setDigits] = useState<string[]>(() => {
    const arr = value.split('').slice(0, length);
    while (arr.length < length) arr.push('');
    return arr;
  });

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value) {
      const arr = value.split('').slice(0, length);
      while (arr.length < length) arr.push('');
      setDigits(arr);
    }
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only alphanumeric/digits
    const char = rawVal.replace(/[^0-9a-zA-Z]/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    const combined = newDigits.join('');
    onChange?.(combined);

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '') && combined.length === length) {
      onComplete?.(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChange?.(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
        onChange?.(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/[^0-9a-zA-Z]/g, '')
      .slice(0, length);

    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setDigits(newDigits);

    const combined = newDigits.join('');
    onChange?.(combined);

    // Focus last filled index or next empty
    const nextFocus = Math.min(pastedData.length, length - 1);
    inputsRef.current[nextFocus]?.focus();

    if (pastedData.length === length) {
      onComplete?.(combined);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3" role="group" aria-label="Verification Code">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold rounded-lg bg-[var(--surface-2,#1e293b)] text-[var(--foreground,#f8fafc)] border transition-all duration-150 outline-none
            ${
              error
                ? 'border-[var(--danger,#ef4444)] text-[var(--danger,#ef4444)] focus:ring-2 focus:ring-[var(--danger,#ef4444)]/30'
                : 'border-[var(--border,rgba(255,255,255,0.1))] focus:border-[var(--focus,#3b82f6)] focus:ring-2 focus:ring-[var(--focus,#3b82f6)]/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'}
          `}
        />
      ))}
    </div>
  );
};
