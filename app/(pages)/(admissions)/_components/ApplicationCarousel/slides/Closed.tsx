'use client';

import React from 'react';
interface ABitMoreProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
  isActive: boolean;
}

export default function Closed({}) {

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center pb-24">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          CLOSED STATE GAHHHH HRAHHHH 
        </h1>
      </div>
    </section>
  );
}
