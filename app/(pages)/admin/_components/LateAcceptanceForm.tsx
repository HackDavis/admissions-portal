'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PhoneInput from 'react-phone-number-input/input';

import useCreateLateAcceptance from '../_hooks/useCreateLateAcceptance';
import { MultiSelectGroup } from '@pages/(admissions)/_components/ApplicationCarousel/_components/MultiSelectGroup';
import { SearchableSelect } from '@pages/(admissions)/_components/ApplicationCarousel/_components/SearchableSelect';
import { YesNoGroup } from '@pages/(admissions)/_components/ApplicationCarousel/_components/YesNoGroup';
import { Application } from '@/app/_types/application';
import {
  COLLEGE_OPTIONS,
  DIETARY_OPTIONS,
  GENDER_OPTIONS,
  LEVEL_OF_STUDY_OPTIONS,
  RACE_OPTIONS,
} from '@app/_data/applicationOptions';
import {
  DUPLICATE_APPLICATION_ERROR,
  LateAcceptanceFieldErrors,
  LateAcceptanceInput,
  SHIRT_SIZE_OPTIONS,
  UC_DAVIS,
  YEAR_OPTIONS,
  validateLateAcceptance,
} from '@app/_utils/lateAcceptance';
import { fetchCountryNames } from '@utils/fetch/fetchCountryNames';
import { fetchMajors } from '@utils/fetch/fetchMajors';
import { fetchMinors } from '@utils/fetch/fetchMinors';
import { fetchUniversityNames } from '@utils/fetch/fetchUniversityNames';

type FormState = Record<string, string | string[] | boolean | null>;

const MLH_CODE = 'MLH Code of Conduct';
const MLH_LOGISTICS = 'Event Logistics Information';
const LISTS = {
  universities: fetchUniversityNames,
  countries: fetchCountryNames,
  majors: fetchMajors,
  minors: fetchMinors,
};

type FieldConfig = {
  key: string;
  label: string | ((form: FormState) => string);
  show?: (form: FormState) => boolean;
  disabled?: (form: FormState) => boolean;
} & (
  | { kind: 'text'; type?: 'email' | 'url' }
  | { kind: 'phone' | 'age' | 'yesno' }
  | { kind: 'select' | 'multi'; options: string[] }
  | { kind: 'search'; list: keyof typeof LISTS; pinned?: string[] }
);

const isUCDavis = (form: FormState) =>
  form.isUCDavisStudent === true || form.university === UC_DAVIS;

const SECTIONS: { title: string; fields: FieldConfig[] }[] = [
  {
    title: 'Contact',
    fields: [
      { key: 'email', label: 'Email', kind: 'text', type: 'email' },
      { key: 'firstName', label: 'First name', kind: 'text' },
      { key: 'lastName', label: 'Last name', kind: 'text' },
      { key: 'phone', label: 'Phone', kind: 'phone' },
    ],
  },
  {
    title: 'Eligibility & school',
    fields: [
      { key: 'age', label: 'Age', kind: 'age' },
      {
        key: 'isOver18',
        label: 'Over 18?',
        kind: 'yesno',
        disabled: (form) => Number(form.age) >= 18,
      },
      { key: 'isUCDavisStudent', label: 'UC Davis student?', kind: 'yesno' },
      {
        key: 'university',
        label: 'University',
        kind: 'search',
        list: 'universities',
        pinned: ['Other'],
        disabled: (form) => form.isUCDavisStudent === true,
      },
      {
        key: 'customUniversity',
        label: 'University name',
        kind: 'text',
        show: (form) => form.university === 'Other',
      },
      {
        key: 'countryOfResidence',
        label: 'Country of residence',
        kind: 'search',
        list: 'countries',
      },
      {
        key: 'levelOfStudy',
        label: 'Level of study',
        kind: 'select',
        options: LEVEL_OF_STUDY_OPTIONS,
      },
      {
        key: 'major',
        label: 'Major',
        kind: 'search',
        list: 'majors',
        pinned: ['Not on this list'],
      },
      {
        key: 'minorOrDoubleMajor',
        label: 'Minor or double major (optional)',
        kind: 'search',
        list: 'minors',
        pinned: ['Not on this list'],
      },
      {
        key: 'college',
        label: 'College',
        kind: 'multi',
        options: COLLEGE_OPTIONS,
        show: isUCDavis,
      },
      { key: 'year', label: 'Year', kind: 'select', options: YEAR_OPTIONS },
    ],
  },
  {
    title: 'Event details',
    fields: [
      {
        key: 'shirtSize',
        label: 'Shirt size',
        kind: 'select',
        options: SHIRT_SIZE_OPTIONS,
      },
      {
        key: 'dietaryRestrictions',
        label: 'Dietary restrictions',
        kind: 'multi',
        options: DIETARY_OPTIONS,
      },
      {
        key: 'attendedHackDavis',
        label: 'Attended HackDavis before?',
        kind: 'yesno',
      },
      { key: 'firstHackathon', label: 'First hackathon?', kind: 'yesno' },
      {
        key: 'gender',
        label: 'Gender (optional)',
        kind: 'multi',
        options: GENDER_OPTIONS,
      },
      {
        key: 'race',
        label: 'Race (optional)',
        kind: 'multi',
        options: RACE_OPTIONS,
      },
    ],
  },
  {
    title: 'Links & consent',
    fields: [
      { key: 'linkedin', label: 'LinkedIn', kind: 'text', type: 'url' },
      {
        key: 'githubOrPortfolio',
        label: 'GitHub or portfolio (optional)',
        kind: 'text',
        type: 'url',
      },
      {
        key: 'connectWithSponsors',
        label: 'Connect with sponsors?',
        kind: 'yesno',
      },
      {
        key: 'resume',
        label: (form) =>
          `Resume link${form.connectWithSponsors ? '' : ' (optional)'}`,
        kind: 'text',
        type: 'url',
      },
      {
        key: 'connectWithHackDavis',
        label: 'Connect with HackDavis?',
        kind: 'yesno',
      },
      { key: 'connectWithMLH', label: 'Connect with MLH?', kind: 'yesno' },
      {
        key: 'mlhAgreements',
        label: 'MLH agreements',
        kind: 'multi',
        options: [MLH_CODE, MLH_LOGISTICS],
      },
    ],
  },
];

// Every field starts empty: '' for text, [] for multi-selects, null for yes/no.
const INITIAL_STATE: FormState = Object.fromEntries(
  SECTIONS.flatMap((s) => s.fields).map((f) => [
    f.key,
    f.kind === 'multi' ? [] : f.kind === 'yesno' ? null : '',
  ])
);
INITIAL_STATE.countryOfResidence = 'United States of America';
INITIAL_STATE.linkedin = 'https://www.linkedin.com/in/';

// Converts form state into the payload the server action receives. Nullable
// yes/no answers are passed through so validation can flag them.
function toInput(form: FormState): LateAcceptanceInput {
  const text = (key: string) => String(form[key] ?? '').trim();
  const optional = (key: string) => text(key) || undefined;
  const mlh = form.mlhAgreements as string[];
  const { customUniversity: _, ...fields } = form;

  return {
    ...fields,
    email: text('email'),
    firstName: text('firstName'),
    lastName: text('lastName'),
    age: form.age === '' ? undefined : Number(form.age),
    university:
      form.university === 'Other'
        ? text('customUniversity')
        : text('university'),
    minorOrDoubleMajor: optional('minorOrDoubleMajor'),
    college: isUCDavis(form) ? form.college : [],
    linkedin: text('linkedin'),
    githubOrPortfolio: optional('githubOrPortfolio'),
    resume: optional('resume'),
    mlhAgreements: {
      mlhCodeOfConduct: mlh.includes(MLH_CODE),
      eventLogisticsInformation: mlh.includes(MLH_LOGISTICS),
    },
  } as unknown as LateAcceptanceInput;
}

function useLists() {
  const [lists, setLists] = useState<Record<string, string[]>>({});
  useEffect(() => {
    for (const [name, load] of Object.entries(LISTS)) {
      load().then((options) =>
        setLists((current) => ({ ...current, [name]: [...new Set(options)] }))
      );
    }
  }, []);
  return lists;
}

const inputClass =
  'w-full border border-black bg-white px-2 py-1 text-xs disabled:bg-gray-100 disabled:text-gray-500';

export default function LateAcceptanceForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [attempted, setAttempted] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] =
    useState<LateAcceptanceFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Application | null>(null);
  const { submit, loading } = useCreateLateAcceptance();
  const lists = useLists();

  // Client errors only show after the first submit attempt, then update live.
  const errors: Record<string, string | undefined> = {
    ...serverFieldErrors,
    ...(attempted ? validateLateAcceptance(toInput(form)) : {}),
  };

  function update(key: string, value: FormState[string]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'age') {
        if (Number(value) >= 18) next.isOver18 = true;
        else if (current.isOver18 === true) next.isOver18 = null;
      }
      if (key === 'isUCDavisStudent' && value === true) {
        next.university = UC_DAVIS;
      }
      if (key === 'dietaryRestrictions') {
        const selected = value as string[];
        if (selected.includes('None') && selected.length > 1)
          next.dietaryRestrictions = ['None'];
      }
      return next;
    });
    setServerFieldErrors(
      ({ [key as keyof LateAcceptanceInput]: _, ...rest }) => rest
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setSubmitError(null);

    const input = toInput(form);
    if (Object.keys(validateLateAcceptance(input)).length > 0) {
      setSubmitError('Fix the highlighted fields before submitting.');
      return;
    }

    const result = await submit(input);
    if (result.ok) {
      setCreated(result.body);
      return;
    }
    setServerFieldErrors(result.fieldErrors ?? {});
    setSubmitError(result.error);
  }

  function reset() {
    setForm(INITIAL_STATE);
    setAttempted(false);
    setServerFieldErrors({});
    setSubmitError(null);
    setCreated(null);
  }

  function renderInput(field: FieldConfig) {
    const value = form[field.key];
    const disabled = field.disabled?.(form);
    const onChange = (next: FormState[string]) => update(field.key, next);

    switch (field.kind) {
      case 'text':
        return (
          <input
            type={field.type ?? 'text'}
            className={inputClass}
            value={value as string}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'age':
        return (
          <input
            inputMode="numeric"
            className={inputClass}
            value={value as string}
            onChange={(e) =>
              onChange(e.target.value.replace(/\D/g, '').slice(0, 2))
            }
          />
        );
      case 'phone':
        return (
          <PhoneInput
            defaultCountry="US"
            className={inputClass}
            value={value as string}
            onChange={(next) => onChange(next ?? '')}
          />
        );
      case 'select':
        return (
          <select
            className={inputClass}
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select...</option>
            {field.options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        );
      case 'search':
        return (
          <SearchableSelect
            placeholder="Select..."
            value={value as string}
            options={lists[field.list] ?? []}
            pinnedOptions={field.pinned}
            disabled={disabled}
            onChange={onChange}
          />
        );
      case 'yesno':
        return (
          <YesNoGroup
            value={value as boolean | null}
            disabled={disabled}
            onChange={onChange}
          />
        );
      case 'multi':
        return (
          <MultiSelectGroup
            options={field.options}
            value={value as string[]}
            onChange={onChange}
          />
        );
    }
  }

  if (created) {
    return (
      <div className="flex flex-col items-start gap-3 border border-black p-4">
        <h2 className="text-sm font-semibold uppercase">
          Late acceptance added
        </h2>
        <p className="text-xs">
          {created.firstName} {created.lastName} ({created.email}) was added as
          accepted.
        </p>
        {/* TODO(#121): remove once the form saves to the database. */}
        <p className="text-[11px] text-gray-600">
          Preview only: nothing is saved until the backend from #121 is
          connected.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="special-button px-2 py-1 text-xs"
          >
            add another
          </button>
          <Link href="/admin" className="special-button px-2 py-1 text-xs">
            back to applicants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {SECTIONS.map((section) => (
        <fieldset key={section.title} className="border border-black p-4">
          <legend className="px-1 text-xs font-semibold uppercase">
            {section.title}
          </legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {section.fields
              .filter((field) => field.show?.(form) ?? true)
              .map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <span className="text-xs font-medium">
                    {typeof field.label === 'function'
                      ? field.label(form)
                      : field.label}
                  </span>
                  {renderInput(field)}
                  {errors[field.key] && (
                    <p className="text-[11px] text-red-600">
                      {errors[field.key]}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </fieldset>
      ))}

      {submitError && (
        <div
          role="alert"
          className="border border-red-600 bg-red-50 p-3 text-xs text-red-700"
        >
          <p>{submitError}</p>
          {submitError === DUPLICATE_APPLICATION_ERROR && (
            <p className="mt-1">
              Their existing application was not changed. Find them in the{' '}
              <Link href="/admin" className="underline">
                applicant list
              </Link>{' '}
              instead.
            </p>
          )}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className={`special-button px-3 py-1 text-xs ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'adding...' : 'add late acceptance'}
        </button>
      </div>
    </form>
  );
}
