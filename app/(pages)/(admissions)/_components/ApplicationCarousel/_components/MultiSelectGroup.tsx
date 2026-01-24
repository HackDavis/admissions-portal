'use client';

import React from 'react';
import { FiCheck } from 'react-icons/fi';

export interface MultiSelectGroupProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean; // ✅ NEW
}

export function MultiSelectGroup({
  options,
  value,
  onChange,
  disabled = false, // ✅ NEW
}: MultiSelectGroupProps) {
  function toggle(option: string) {
    if (disabled) return; // ✅ NEW (no-op when disabled)

    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div
      className={[
        'mt-4 flex flex-col gap-3',
        disabled ? 'opacity-60 pointer-events-none select-none' : '',
      ].join(' ')}
      aria-disabled={disabled}
    >
      {options.map((option) => (
        <MultiSelectOption
          key={option}
          label={option}
          active={value.includes(option)}
          onClick={() => toggle(option)}
          disabled={disabled} // ✅ NEW
        />
      ))}
    </div>
  );
}

function MultiSelectOption({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex w-fit items-center gap-3 rounded-full transition',
        active
          ? 'bg-[#173B47] px-4 py-2 text-white shadow-[4px_4px_0_rgba(159,182,190,0.8)]'
          : 'px-1 py-1 ml-3 text-[#005271]',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'grid h-5 w-5 place-items-center rounded border-2',
          active
            ? 'border-white bg-[#9FB6BE] text-[#173B47]'
            : 'border-[#9FB6BE] bg-white',
        ].join(' ')}
      >
        {active && <FiCheck className="h-3.5 w-3.5" />}
      </span>

      <span className="text-sm font-medium leading-none">{label}</span>
    </button>
  );
}
