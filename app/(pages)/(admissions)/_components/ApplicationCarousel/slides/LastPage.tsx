'use client';

import React from 'react';

interface LastPageProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function LastPage({
  formData,
  setFormData,
  onNext,
}: LastPageProps) {
  // const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleFinish = async () => {
    setSubmitting(true);
    setError('');

    try {
      await onNext?.();
    } catch (err) {
      console.error(err);
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full">
      {/* Centered column */}
      <div className="mx-auto w-full max-w-[520px] text-center">
        {/* Title */}
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          You’re almost
          <br />
          there, last page!
        </h1>

        {/* Inputs */}
        <div className="mx-auto mt-12 w-full max-w-[520px] text-left space-y-8">
          <Field
            label={<>Share your GitHub or portfolio link (if you have one)!</>}
            value={formData.githubOrPortfolio}
            onChange={(v) => setFormData({ ...formData, githubOrPortfolio: v })}
          />

          <Field
            label="or LinkedIn"
            value={formData.linkedin}
            onChange={(v) => setFormData({ ...formData, linkedin: v })}
          />

          <Field
            label="Feel free to share your resume."
            value={formData.resume}
            onChange={(v) => setFormData({ ...formData, resume: v })}
          />

          {/* Finish */}
          <div className="pt-6 flex justify-center">
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center gap-3 rounded-full bg-[#005271] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95"
            >
              {submitting ? 'Submitting...' : 'Finish'}
              <span aria-hidden>→</span>
            </button>

            {error && (
              <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- small helper ---------- */

function Field({
  label,
  value,
  onChange,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-base font-semibold text-[#0F2530]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-full bg-[#E5EEF1] px-6 py-4 text-sm outline-none"
      />
    </div>
  );
}
