'use client';

import { Application } from '@/app/_types/application';

interface ApplicantDetailsModalProps {
  applicant: Application;
  onClose: () => void;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return String(value);
}

function toUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
    return trimmed;
  return `https://${trimmed}`;
}

export default function ApplicantDetailsModal({
  applicant,
  onClose,
}: ApplicantDetailsModalProps) {
  const rows = [
    { label: 'id', value: applicant._id },
    {
      label: 'name',
      value: `${applicant.firstName ?? '-'} ${applicant.lastName ?? ''}`.trim(),
    },
    { label: 'email', value: applicant.email },
    { label: 'phone', value: applicant.phone },
    { label: 'age', value: applicant.age },
    { label: 'is over 18', value: applicant.isOver18 },
    { label: 'ucd', value: applicant.isUCDavisStudent },
    { label: 'university', value: applicant.university },
    { label: 'country of residence', value: applicant.countryOfResidence },
    { label: 'level of study', value: applicant.levelOfStudy },
    { label: 'major', value: applicant.major },
    { label: 'minor / double major', value: applicant.minorOrDoubleMajor },
    { label: 'college', value: applicant.college },
    { label: 'year', value: applicant.year },
    { label: 'shirt size', value: applicant.shirtSize },
    { label: 'dietary restrictions', value: applicant.dietaryRestrictions },
    { label: 'connect with sponsors', value: applicant.connectWithSponsors },
    { label: 'gender', value: applicant.gender },
    { label: 'race', value: applicant.race },
    { label: 'attended hackdavis before', value: applicant.attendedHackDavis },
    { label: 'first hackathon', value: applicant.firstHackathon },
    {
      label: 'linkedin',
      value: applicant.linkedin,
      href: toUrl(applicant.linkedin),
    },
    {
      label: 'github / portfolio',
      value: applicant.githubOrPortfolio,
      href: toUrl(applicant.githubOrPortfolio),
    },
    {
      label: 'resume',
      value: applicant.resume,
      href: toUrl(applicant.resume),
    },
    { label: 'connect with hackdavis', value: applicant.connectWithHackDavis },
    { label: 'connect with mlh', value: applicant.connectWithMLH },
    {
      label: 'mlh agreements',
      value:
        applicant.mlhAgreements.mlhCodeOfConduct &&
        applicant.mlhAgreements.eventLogisticsInformation,
    },
    { label: 'status', value: applicant.status },
    { label: 'was waitlisted', value: applicant.wasWaitlisted },
    { label: 'submitted at', value: applicant.submittedAt },
    { label: 'reviewed at', value: applicant.reviewedAt },
    { label: 'processed at', value: applicant.processedAt },
    { label: 'batch', value: applicant.batchNumber },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close details"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto border-2 border-black bg-white p-4 text-xs">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 border border-black px-2 py-1 text-xs uppercase"
          aria-label="Close"
        >
          x
        </button>

        <h3 className="mb-3 text-sm font-semibold uppercase">
          applicant details
        </h3>

        <div className="grid gap-2 md:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="border border-black p-2">
              <p className="text-[10px] font-semibold uppercase">{row.label}</p>
              {row.href ? (
                <a
                  href={row.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline"
                >
                  {formatValue(row.value)}
                </a>
              ) : (
                <p className="text-xs">{formatValue(row.value)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
