'use client';

import React from 'react';

export interface YesNoGroupProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}

export function YesNoGroup({
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
}: YesNoGroupProps) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <YesNoOption
        label={yesLabel}
        active={value === true}
        onClick={() => onChange(true)}
      />
      <YesNoOption
        label={noLabel}
        active={value === false}
        onClick={() => onChange(false)}
      />
    </div>
  );
}

function YesNoOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-fit items-center gap-3 rounded-full transition',
        active
          ? 'bg-[#173B47] px-4 py-2 text-white shadow-[4px_4px_0_rgba(159,182,190,0.8)]'
          : 'px-1 py-1 text-[#005271] ml-3',
      ].join(' ')}
    >
      <span
        className={[
          'h-4 w-4 rounded-full border-2',
          active ? 'border-white bg-[#9FB6BE]' : 'border-[#9FB6BE]',
        ].join(' ')}
      />
      <span className="text-sm font-medium leading-none">{label}</span>
    </button>
  );
}
