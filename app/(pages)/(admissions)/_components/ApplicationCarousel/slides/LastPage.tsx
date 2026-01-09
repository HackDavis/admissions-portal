'use client';

import * as React from 'react';

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

  const handleFinish = async () => {
    // Navigate to next slide (confirmation)
    onNext?.();
  };

  // const onPickFile = () => fileInputRef.current?.click();

  // const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const f = e.target.files?.[0];
  //   setFormData({ ...formData, resume: f ? f.name : '' });
  // };

  // const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
  //   e.preventDefault();
  //   const f = e.dataTransfer.files?.[0];
  //   if (!f) return;
  //   setFormData({ ...formData, resume: f.name });
  // };

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

          {/* Upload resume feature -- no longer being used but will keep here */}
          {/* <div className="pt-2">
            <p className="mb-4 text-base font-semibold text-[#0F2530]">
              Feel free to share your resume.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="relative w-full rounded-[22px] border-2 border-dashed border-[#B7CBD2] bg-white px-10 py-12 text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileChange}
              />

              {formData.resume ? (
                <div className="space-y-2">
                  <p className="text-sm text-[#0F2530]">{formData.resume}</p>
                  <button
                    type="button"
                    onClick={onPickFile}
                    className="text-sm font-semibold text-[#005271] underline underline-offset-2"
                  >
                    choose a different file
                  </button>
                </div>
              ) : (
                <p className="text-[18px] font-medium text-[#7B8F97] whitespace-nowrap">
                  Drag or drop a file or{' '}
                  <button
                    type="button"
                    onClick={onPickFile}
                    className="inline underline underline-offset-2 align-baseline"
                  >
                    browse
                  </button>
                </p>
              )}
            </div>
          </div> */}

          {/* Finish */}
          <div className="pt-6 flex justify-center">
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-3 rounded-full bg-[#005271] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95"
            >
              Finish <span aria-hidden>→</span>
            </button>
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
