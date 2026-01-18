import React, { useState } from 'react';
import Image from 'next/image';
import { useCheckEmail } from '../../../_hooks/useCheckEmail';

interface EmailProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function Email({ formData, setFormData, onNext }: EmailProps) {
  const { checkEmail, loading, error } = useCheckEmail();
  const [submitted, setSubmitted] = useState(false);
  const isValidEdu =
    formData.email.endsWith('.edu') && formData.email.includes('@');

  const handleNext = async () => {
    setSubmitted(true);
    if (!isValidEdu) return;

    const ok = await checkEmail(formData.email);
    if (ok) onNext?.();
  };

  return (
    <section className="relative w-full">
      <div
            className="
              pointer-events-none
              border
              border-red-600
              absolute
              top-0
              hidden sm:block
              // w-56 h-56
              // md:w-64 md:h-64
              // lg:w-80 lg:h-80
            "
          >
            <Image
              src="/Images/Peeping.svg"
              alt="Animals peering from behind a wall."
              fill
              className="object-contain"
              priority
            />
          </div>
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
        <p className="mt-3 text-base font-medium text-[#173B47]">as a hacker</p>
      </header>

      <div className="mt-12 flex flex-col items-center gap-8">
        <div className="w-full max-w-md">
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter School Email (.edu)"
            className="w-full border-b-2 border-[#005271]/60 bg-transparent py-3 text-center text-xl outline-none placeholder:text-[#9FB6BE]"
          />
        </div>
        {submitted && error && (
          <p className="text-sm font-semibold text-red-400">{error}</p>
        )}

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
    </section>
  );
}
