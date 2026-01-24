'use client';

import React from 'react';

interface ABitMoreProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function ABitMore({
  formData,
  setFormData,
  onNext,
}: ABitMoreProps) {
  const [submitted, setSubmitted] = React.useState(false);

  const isLinkedInValid = (url: string) =>
    /^https?:\/\/(www\.)?linkedin\.com\/.+$/.test(url.trim());

  const isValidUrl = (url: string) => {
    try {
      new URL(url.trim());
      return true;
    } catch {
      return false;
    }
  };

  const isValid =
    !!formData.linkedin?.trim() &&
    isLinkedInValid(formData.linkedin) &&
    !!formData.resume?.trim() &&
    isValidUrl(formData.resume);

  const handleNext = () => {
    setSubmitted(true);
    if (!isValid) return; // stops next if validation fails
    onNext?.();
  };

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Just a bit more...
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Responses are only collected to improve HackDavis.
        </p>

        <div className="mx-auto mt-12 w-full max-w-lg space-y-10 text-left">
          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-semibold text-[#0F2530]">
              Link your LinkedIn here!*
            </label>

            <input
              type="url"
              value={formData.linkedin || ''}
              onChange={(e) =>
                setFormData({ ...formData, linkedin: e.target.value })
              }
              placeholder="Ex: https://www.linkedin.com/in/your-username"
              className="mt-3 w-full rounded-full bg-[#E5EEF1] px-6 py-4 text-sm text-[#0F2530] outline-none"
            />

            {submitted && !formData.linkedin?.trim() && (
              <p className="mt-2 text-sm font-semibold text-red-400">
                ERROR: Please enter a link to your LinkedIn.
              </p>
            )}

            {submitted &&
              formData.linkedin?.trim() &&
              !isLinkedInValid(formData.linkedin) && (
                <p className="mt-2 text-sm font-semibold text-red-400">
                  ERROR: Please enter a valid LinkedIn URL.
                </p>
              )}
          </div>

          {/* GitHub / Portfolio */}
          <div>
            <label className="block text-sm font-semibold text-[#0F2530]">
              (OPTIONAL) Link your GitHub / Portfolio here!
            </label>

            <input
              type="url"
              value={formData.githubOrPortfolio || ''}
              onChange={(e) =>
                setFormData({ ...formData, githubOrPortfolio: e.target.value })
              }
              placeholder=""
              className="mt-3 w-full rounded-full bg-[#E5EEF1] px-6 py-4 text-sm text-[#0F2530] outline-none"
            />

            {submitted &&
              formData.githubOrPortfolio?.trim() &&
              !isValidUrl(formData.githubOrPortfolio) && (
                <p className="mt-2 text-sm font-semibold text-red-400">
                  ERROR: Please enter a valid URL.
                </p>
              )}
          </div>

          {/* Resume (text box per your note) */}
          <div>
            <label className="block text-sm font-semibold text-[#0F2530]">
              Please enter a publicly accessible link to your resume!*
            </label>

            <textarea
              value={formData.resume || ''}
              onChange={(e) =>
                setFormData({ ...formData, resume: e.target.value })
              }
              placeholder="Ex: https://drive.google.com/file/d/your-shared-link"
              className="mt-3 h-28 w-full resize-none rounded-2xl bg-[#E5EEF1] px-6 py-4 text-sm text-[#0F2530] outline-none"
            />

            {submitted && !formData.resume?.trim() && (
              <p className="mt-2 text-sm font-semibold text-red-400">
                ERROR: Please enter a link to your resume.
              </p>
            )}

            {submitted &&
              formData.resume?.trim() &&
              !isValidUrl(formData.resume) && (
                <p className="mt-2 text-sm font-semibold text-red-400">
                  ERROR: Please enter a valid URL.
                </p>
              )}
          </div>
        </div>

        {/* Bottom button */}
        <div className="mt-14 flex justify-center">
          <button
            type="button"
            onClick={handleNext}
            disabled={!isValid}
            className={`flex items-center gap-3 rounded-full bg-[#005271] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95 ${
              isValid ? 'bg-[#005271]' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
