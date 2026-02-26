'use client';

import React from 'react';
import { YesNoGroup } from '../_components/YesNoGroup';
import { useEnterKey } from '../../../_hooks/useEnterKey';
import { FaLinkedin } from 'react-icons/fa';
import { LuLink } from 'react-icons/lu';

interface ABitMoreProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
  isActive: boolean;
}

const normalizeLinkedIn = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  let withoutProtocol = trimmed.replace(/^https?:\/\//, '');
  if (!withoutProtocol.startsWith('www.')) {
    withoutProtocol = 'www.' + withoutProtocol;
  }
  return 'https://' + withoutProtocol;
};

const isLinkedInValid = (url: string) => {
  if (!url.trim()) return false;
  const normalized = normalizeLinkedIn(url);
  return /^https?:\/\/(www\.)?linkedin\.com\/in\/.+$/.test(normalized);
};

const isValidUrl = (url: string) => {
  if (!url) return false;
  let normalized = url.trim();
  // Append https:// if none provided
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }
  try {
    const parsed = new URL(normalized);
    // Require a . in the link
    if (!parsed.hostname.includes('.')) return false;
    // Must end in (2+ letters)
    if (!/\.[a-z]{2,}$/i.test(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
};

export default function ABitMore({
  formData,
  setFormData,
  onNext,
  isActive,
}: ABitMoreProps) {
  const [submitted, setSubmitted] = React.useState(false);

  const resumeRequired = formData.connectWithSponsors === true;

  const hasGithub = !!formData.githubOrPortfolio?.trim();

  const linkedinShowError =
    submitted &&
    !!formData.linkedin?.trim() &&
    !isLinkedInValid(formData.linkedin);

  const isValid =
    typeof formData.connectWithSponsors === 'boolean' &&
    !!formData.linkedin?.trim() &&
    isLinkedInValid(formData.linkedin) &&
    (!resumeRequired ||
      (!!formData.resume?.trim() && isValidUrl(formData.resume))) &&
    (!hasGithub || isValidUrl(formData.githubOrPortfolio!));

  const handleNext = () => {
    setSubmitted(true);
    if (!isValid) return; // stops next if validation fails
    onNext?.();
  };

  useEnterKey(handleNext, isActive);

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center pb-24">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Just a bit more...
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Responses are only collected to improve HackDavis.
        </p>

        <div className="mx-auto text-left w-full max-w-lg mt-6 sm:mt-12 space-y-3 sm:space-y-6 px-2 sm:px-0">
          {/* LinkedIn */}
          <div>
            <label className="block text-sm font-semibold text-[#0F2530]">
              Link your LinkedIn here!*
            </label>
            <div className="relative mt-3">
              <FaLinkedin className="absolute left-6 top-1/2 -translate-y-1/2 text-[#005271] text-lg pointer-events-none" />

              <input
                type="url"
                value={formData.linkedin || ''}
                onChange={(e) =>
                  setFormData({ ...formData, linkedin: e.target.value })
                }
                onBlur={() => {
                  if (formData.linkedin?.trim()) {
                    setFormData({
                      ...formData,
                      linkedin: normalizeLinkedIn(formData.linkedin),
                    });
                  }
                }}
                placeholder="https://www.linkedin.com/in/your-username"
                className={[
                  'w-full rounded-full bg-[#E5EEF1] pl-14 pr-6 py-4 text-sm text-[#0F2530] outline-none',
                  linkedinShowError ? 'ring-1 ring-red-400' : '',
                ].join(' ')}
              />
            </div>

            <p
              className={`mt-2 text-sm font-semibold text-red-400 ${
                (submitted && !formData.linkedin?.trim()) ||
                (submitted &&
                  !!formData.linkedin?.trim() &&
                  !isLinkedInValid(formData.linkedin))
                  ? ''
                  : 'invisible'
              }`}
            >
              {submitted &&
              formData.linkedin?.trim() &&
              !isLinkedInValid(formData.linkedin)
                ? 'ERROR: Please enter a valid LinkedIn URL (e.g. linkedin.com/in/your-username)'
                : 'ERROR: Please enter your LinkedIn profile URL.'}
            </p>
          </div>

          {/* GitHub / Portfolio */}
          <div>
            <label className="block text-sm font-semibold text-[#0F2530]">
              (OPTIONAL) Link your GitHub / Portfolio here!
            </label>

            <div className="relative mt-3">
              <LuLink className="absolute left-6 top-1/2 -translate-y-1/2 text-[#005271] text-lg pointer-events-none" />

              <input
                type="url"
                value={formData.githubOrPortfolio || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    githubOrPortfolio: e.target.value,
                  })
                }
                className="w-full rounded-full bg-[#E5EEF1] pl-14 pr-6 py-4 text-sm text-[#0F2530] outline-none"
              />
            </div>

            <p
              className={`mt-2 text-sm font-semibold text-red-400 ${
                formData.githubOrPortfolio?.trim() &&
                !isValidUrl(formData.githubOrPortfolio)
                  ? ''
                  : 'invisible'
              }`}
            >
              ERROR: Please enter a valid URL.
            </p>
          </div>

          {/* Sponsors connect */}
          <div>
            <p className="text-base font-semibold text-[#0F2530]">
              Would you like to be connected to internship and full-time career
              opportunities from our sponsors and partners?*
            </p>

            <YesNoGroup
              value={formData.connectWithSponsors}
              onChange={(v) =>
                setFormData({ ...formData, connectWithSponsors: v })
              }
            />

            <p
              className={`mt-3 text-sm font-semibold text-red-400 ${
                submitted && typeof formData.connectWithSponsors !== 'boolean'
                  ? ''
                  : 'invisible'
              }`}
            >
              ERROR: Please select an option.
            </p>
          </div>

          {/* Resume (text box per your note) */}
          <div>
            <label className="block text-sm font-semibold text-[#0F2530]">
              Please enter a publicly accessible link to your resume!
              {resumeRequired && '*'}
            </label>

            <textarea
              value={formData.resume || ''}
              onChange={(e) =>
                setFormData({ ...formData, resume: e.target.value })
              }
              placeholder="https://drive.google.com/file/d/your-shared-link"
              className="mt-3 h-28 w-full resize-none rounded-2xl bg-[#E5EEF1] px-6 py-4 text-sm text-[#0F2530] outline-none"
            />

            <p
              className={`mt-2 text-sm font-semibold text-red-400 ${
                (submitted && resumeRequired && !formData.resume?.trim()) ||
                (submitted &&
                  !!formData.resume?.trim() &&
                  !isValidUrl(formData.resume))
                  ? ''
                  : 'invisible'
              }`}
            >
              {submitted &&
              formData.resume?.trim() &&
              !isValidUrl(formData.resume)
                ? 'ERROR: Please enter a valid URL.'
                : 'ERROR: Please enter a link to your resume.'}
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleNext}
            disabled={!isValid}
            className={`flex items-center gap-3 rounded-full px-10 py-4 text-base font-semibold text-white transition hover:opacity-95 ${
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
