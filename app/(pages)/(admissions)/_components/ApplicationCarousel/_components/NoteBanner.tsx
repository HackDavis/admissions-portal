'use client';

import React from 'react';
import Image from 'next/image';
export interface NoteBannerProps {
  emoji: string;
  bold:string;
  message: string;
}

export function NoteBanner({
  emoji,
  bold,
  message
}: NoteBannerProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6">
        <div className="rounded-[28px] border-[#A6BFC7] border bg-[#E5EEF1] p-3 shadow-[6px_8px_0_#A6BFC7] relative grid grid-cols-[15%_1fr]">
            <div className="relative flex items-center justify-center">
                <div className="relative h-28 w-28 border border-red-500">
                    <Image
                    src={emoji}
                    alt="notification icon"
                    fill
                    className="object-contain"
                    priority
                    />
                </div>
            </div>

            <div className="relative flex items-center justify-center">
                <p className="text-sm text-[#173B47] border border-blue-600">
                    <strong className="mr-1">{bold}</strong>
                    {message}
                </p>
            </div>
        </div>
    </div>
  );
}