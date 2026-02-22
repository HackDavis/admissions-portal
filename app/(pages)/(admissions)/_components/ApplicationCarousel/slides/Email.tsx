'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCheckEmail } from '../../../_hooks/useCheckEmail';
import { useEnterKey } from '../../../_hooks/useEnterKey';

interface EmailProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
  isActive: boolean;
}

export default function Email({
  formData,
  setFormData,
  onNext,
  isActive,
}: EmailProps) {
  const { checkEmail, loading, error } = useCheckEmail();
  const [submitted, setSubmitted] = useState(false);

  // Email input has no spaces, has @, ends in .edu
  const eduRegex = /^[^\s@]+@[^\s@]+\.edu$/;

  const showEduError =
    formData.email.length > 0 && !eduRegex.test(formData.email);

  const isValidEdu = eduRegex.test(formData.email);

  const handleNext = async () => {
    setSubmitted(true);
    if (!isValidEdu) return;

    const ok = await checkEmail(formData.email);
    if (ok) onNext?.();
  };

  useEnterKey(handleNext, isActive);

  return (
    <section className="relative w-full">
      {/* Peeping animals pinned to top-left */}
      <div
        className="
          pointer-events-none
          absolute
          left-0
          top-0
          hidden sm:block
          z-0
        "
      >
        {/* Make THIS box the exact size you want */}
        <div className="relative h-[320px] w-[320px]">
          <Image
            src="/Images/Peeping.svg"
            alt="Animals peering from behind a wall."
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </div>

      {/* Content above it */}
      <div className="relative z-10">
        <header className="text-center">
          <Image
            src="/Images/HDLogo.svg"
            alt="HackDavis Logo"
            width={100}
            height={100}
            className="mx-auto py-6"
          />
          <p className="text-sm tracking-wide text-[#005271]">
            APPLY TO PARTICIPATE IN
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#005271]">
            HACKDAVIS 2026
          </h1>
          <p className="mt-3 text-base font-medium text-[#173B47]">
            as a hacker
          </p>
        </header>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="w-full max-w-md">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setSubmitted(false);
              }}
              placeholder="Enter School Email (.edu)"
              className="w-full border-b-2 border-[#005271]/60 bg-transparent py-3 text-center text-xl outline-none placeholder:text-[#9FB6BE]"
            />
          </div>

          <p
            className={`mt-2 text-sm font-semibold text-red-500 ${
              showEduError || (submitted && error) ? '' : 'invisible'
            }`}
          >
            {submitted && error
              ? error
              : 'Please enter a valid school email ending in .edu'}
          </p>

          <button
            type="button"
            disabled={loading || !isValidEdu}
            onClick={handleNext}
            className={`rounded-full px-8 py-3 text-white ${
              isValidEdu && !loading
                ? 'bg-[#005271]'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Checking...' : 'Access Portal →'}
          </button>
        </div>
      </div>
    </section>
  );
}
