'use client';

import React from 'react';
import Image from 'next/image';

export interface NoteBannerProps {
  emoji: string;
  bold: string;
  message: string;
}

export function NoteBanner({ emoji, bold, message }: NoteBannerProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      <div className="rounded-[40px] border border-[#A6BFC7] bg-[#fff] shadow-[10px_10px_0_#A6BFC7]">
        <div className="flex items-center gap-6 px-8 py-3">
          <div className="relative h-[88px] w-[88px] shrink-0">
            <Image
              src={emoji}
              alt="notification icon"
              fill
              className="object-contain"
              priority
            />
          </div>

          <p className="text-[18px] leading-[1.5] text-[#173B47]">
            <strong className="font-extrabold">{bold}</strong> {message}
          </p>
        </div>
      </div>
    </div>
  );
}
