'use client';

import React from 'react';

export interface NoteBannerProps {
  value: boolean | null;
  emoji: string;
  message: string;
}

export function NoteBanner({
  value,
  emoji,
  message
}: NoteBannerProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6">
        <div className="relative rounded-[28px] border-[#A6BFC7] border bg-[#E5EEF1] p-3 shadow-[6px_8px_0_#A6BFC7] flex flex-row">
            <div className="border border-red-500">
                <p>test</p>
            </div>
            <p className="text-sm border border-blue-500">
                {emoji}
                {message}
            </p>
        </div>
    </div>
  );
}