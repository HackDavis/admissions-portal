'use client';

import React from 'react';
import Image from 'next/image';

export default function Confirmation() {
  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <p className="text-xs font-semibold tracking-[0.12em] text-[#005271]">
          YOU’RE ARE IN!
        </p>

        <h1 className="mt-3 font-metropolis text-[40px] font-bold leading-[1.05] tracking-[0.01em] text-[#005271]">
          Thanks for Signing Up
          <br />
          for HackDavis 2026
        </h1>

        <p className="mx-auto mt-6 max-w-[440px] text-sm leading-snug text-[#0F2530]">
          Thanks for registering for HackDavis 2026. We’re
          <br />
          excited to have you apply!
        </p>

        <p className="mx-auto mt-4 max-w-[460px] text-sm leading-snug text-[#0F2530]">
          <span className="font-bold">
            Please note that your participation is not yet
          </span>
          <br />
          <span className="font-bold">confirmed.</span> We’ll be in touch soon
          with more details,
          <br />
          updates, and important information as the event
          <br />
          approaches.
        </p>

        <div className="mt-12 flex justify-center">
          <Image
            src="/Images/Podium.svg"
            alt="HackDavis mascots standing on a winners' podium holding trophies."
            width={520}
            height={360}
            className="h-auto w-full max-w-[520px]"
            priority
          />
        </div>
      </div>
    </section>
  );
}
