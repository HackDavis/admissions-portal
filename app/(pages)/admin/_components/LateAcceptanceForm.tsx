'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PhoneInput from 'react-phone-number-input/input';

import useCreateLateAcceptance from '../_hooks/useCreateLateAcceptance';
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

type YesNo = boolean | null;

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: string;
  isOver18: YesNo;
  isUCDavisStudent: YesNo;
  university: string;
  countryOfResidence: string;
  levelOfStudy: string;
  major: string;
  minorOrDoubleMajor: string;
  college: string[];
  year: string;
  shirtSize: string;
  dietaryRestrictions: string[];
  gender: string[];
  race: string[];
  attendedHackDavis: YesNo;
  firstHackathon: YesNo;
  linkedin: string;
  githubOrPortfolio: string;
  connectWithSponsors: YesNo;
  resume: string;
  connectWithHackDavis: YesNo;
  connectWithMLH: YesNo;
  mlhCodeOfConduct: boolean;
  eventLogisticsInformation: boolean;
}

const INITIAL_STATE: FormState = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  age: '',
  isOver18: null,
  isUCDavisStudent: null,
  university: '',
  countryOfResidence: 'United States of America',
  levelOfStudy: '',
  major: '',
  minorOrDoubleMajor: '',
  college: [],
  year: '',
  shirtSize: '',
  dietaryRestrictions: [],
  gender: [],
  race: [],
  attendedHackDavis: null,
  firstHackathon: null,
  linkedin: 'https://www.linkedin.com/in/',
  githubOrPortfolio: '',
  connectWithSponsors: null,
  resume: '',
  connectWithHackDavis: null,
  connectWithMLH: null,
  mlhCodeOfConduct: false,
  eventLogisticsInformation: false,
};

// Converts form state into the payload the server action receives. Nullable
// yes/no answers are passed through so validation can flag them.
function toInput(form: FormState): LateAcceptanceInput {
  const trimmed = (value: string) => value.trim();
  const optional = (value: string) => trimmed(value) || undefined;
  const isUCDavis =
    form.isUCDavisStudent === true || trimmed(form.university) === UC_DAVIS;

  return {
    email: trimmed(form.email),
    firstName: trimmed(form.firstName),
    lastName: trimmed(form.lastName),
    phone: form.phone,
    age: form.age === '' ? (undefined as unknown as number) : Number(form.age),
    isOver18: form.isOver18 as boolean,
    isUCDavisStudent: form.isUCDavisStudent as boolean,
    university: trimmed(form.university),
    countryOfResidence: trimmed(form.countryOfResidence),
    levelOfStudy: form.levelOfStudy,
    major: trimmed(form.major),
    minorOrDoubleMajor: optional(form.minorOrDoubleMajor),
    college: isUCDavis ? form.college : [],
    year: form.year as Application['year'],
    shirtSize: form.shirtSize as Application['shirtSize'],
    dietaryRestrictions: form.dietaryRestrictions,
    gender: form.gender,
    race: form.race,
    attendedHackDavis: form.attendedHackDavis as boolean,
    firstHackathon: form.firstHackathon as boolean,
    linkedin: trimmed(form.linkedin),
    githubOrPortfolio: optional(form.githubOrPortfolio),
    connectWithSponsors: form.connectWithSponsors as boolean,
    resume: optional(form.resume),
    connectWithHackDavis: form.connectWithHackDavis as boolean,
    connectWithMLH: form.connectWithMLH as boolean,
    mlhAgreements: {
      mlhCodeOfConduct: form.mlhCodeOfConduct,
      eventLogisticsInformation: form.eventLogisticsInformation,
    },
  };
}

function useOptionList(load: () => Promise<string[]>) {
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    load().then(setOptions);
  }, [load]);
  return options;
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

  const universities = useOptionList(fetchUniversityNames);
  const countries = useOptionList(fetchCountryNames);
  const majors = useOptionList(fetchMajors);
  const minors = useOptionList(fetchMinors);

  const ageNumber = form.age === '' ? null : Number(form.age);
  const ageForcesOver18 = ageNumber !== null && ageNumber >= 18;
  const isUCDavis =
    form.isUCDavisStudent === true || form.university.trim() === UC_DAVIS;

  // Client errors only show after the first submit attempt, then update live.
  const errors: LateAcceptanceFieldErrors = {
    ...serverFieldErrors,
    ...(attempted ? validateLateAcceptance(toInput(form)) : {}),
  };

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'age') {
        const age = value === '' ? null : Number(value);
        if (age !== null && age >= 18) next.isOver18 = true;
        else if (current.isOver18 === true) next.isOver18 = null;
      }
      if (key === 'isUCDavisStudent' && value === true) {
        next.university = UC_DAVIS;
      }
      return next;
    });
    setServerFieldErrors((current) => {
      if (!(key in current)) return current;
      const { [key as keyof LateAcceptanceFieldErrors]: _, ...rest } = current;
      return rest;
    });
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

  const isDuplicate = submitError === DUPLICATE_APPLICATION_ERROR;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Section title="Contact">
        <Field label="Email" error={errors.email}>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </Field>
        <Field label="First name" error={errors.firstName}>
          <input
            className={inputClass}
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <input
            className={inputClass}
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <PhoneInput
            defaultCountry="US"
            className={inputClass}
            value={form.phone}
            onChange={(value) => update('phone', value ?? '')}
          />
        </Field>
      </Section>

      <Section title="Eligibility & school">
        <Field label="Age" error={errors.age}>
          <input
            inputMode="numeric"
            className={inputClass}
            value={form.age}
            onChange={(e) =>
              update('age', e.target.value.replace(/\D/g, '').slice(0, 2))
            }
          />
        </Field>
        <Field label="Over 18?" error={errors.isOver18}>
          <YesNo
            name="isOver18"
            value={form.isOver18}
            disabled={ageForcesOver18}
            onChange={(value) => update('isOver18', value)}
          />
        </Field>
        <Field label="UC Davis student?" error={errors.isUCDavisStudent}>
          <YesNo
            name="isUCDavisStudent"
            value={form.isUCDavisStudent}
            onChange={(value) => update('isUCDavisStudent', value)}
          />
        </Field>
        <Field label="University" error={errors.university}>
          <ListInput
            id="universities"
            options={universities}
            value={form.university}
            disabled={form.isUCDavisStudent === true}
            onChange={(value) => update('university', value)}
          />
        </Field>
        <Field label="Country of residence" error={errors.countryOfResidence}>
          <ListInput
            id="countries"
            options={countries}
            value={form.countryOfResidence}
            onChange={(value) => update('countryOfResidence', value)}
          />
        </Field>
        <Field label="Level of study" error={errors.levelOfStudy}>
          <Select
            options={LEVEL_OF_STUDY_OPTIONS}
            value={form.levelOfStudy}
            onChange={(value) => update('levelOfStudy', value)}
          />
        </Field>
        <Field label="Major" error={errors.major}>
          <ListInput
            id="majors"
            options={majors}
            value={form.major}
            onChange={(value) => update('major', value)}
          />
        </Field>
        <Field label="Minor or double major (optional)">
          <ListInput
            id="minors"
            options={minors}
            value={form.minorOrDoubleMajor}
            onChange={(value) => update('minorOrDoubleMajor', value)}
          />
        </Field>
        {isUCDavis && (
          <Field label="College" error={errors.college}>
            <Checkboxes
              options={COLLEGE_OPTIONS}
              value={form.college}
              onChange={(value) => update('college', value)}
            />
          </Field>
        )}
        <Field label="Year" error={errors.year}>
          <Select
            options={YEAR_OPTIONS}
            value={form.year}
            onChange={(value) => update('year', value)}
          />
        </Field>
      </Section>

      <Section title="Event details">
        <Field label="Shirt size" error={errors.shirtSize}>
          <Select
            options={SHIRT_SIZE_OPTIONS}
            value={form.shirtSize}
            onChange={(value) => update('shirtSize', value)}
          />
        </Field>
        <Field label="Dietary restrictions" error={errors.dietaryRestrictions}>
          <Checkboxes
            options={DIETARY_OPTIONS}
            value={form.dietaryRestrictions}
            onChange={(value, toggled) =>
              update(
                'dietaryRestrictions',
                toggled === 'None'
                  ? value.filter((v) => v === 'None')
                  : value.filter((v) => v !== 'None')
              )
            }
          />
        </Field>
        <Field
          label="Attended HackDavis before?"
          error={errors.attendedHackDavis}
        >
          <YesNo
            name="attendedHackDavis"
            value={form.attendedHackDavis}
            onChange={(value) => update('attendedHackDavis', value)}
          />
        </Field>
        <Field label="First hackathon?" error={errors.firstHackathon}>
          <YesNo
            name="firstHackathon"
            value={form.firstHackathon}
            onChange={(value) => update('firstHackathon', value)}
          />
        </Field>
        <Field label="Gender (optional)" error={errors.gender}>
          <Checkboxes
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={(value) => update('gender', value)}
          />
        </Field>
        <Field label="Race (optional)" error={errors.race}>
          <Checkboxes
            options={RACE_OPTIONS}
            value={form.race}
            onChange={(value) => update('race', value)}
          />
        </Field>
      </Section>

      <Section title="Links & consent">
        <Field label="LinkedIn" error={errors.linkedin}>
          <input
            type="url"
            className={inputClass}
            value={form.linkedin}
            onChange={(e) => update('linkedin', e.target.value)}
          />
        </Field>
        <Field
          label="GitHub or portfolio (optional)"
          error={errors.githubOrPortfolio}
        >
          <input
            type="url"
            className={inputClass}
            value={form.githubOrPortfolio}
            onChange={(e) => update('githubOrPortfolio', e.target.value)}
          />
        </Field>
        <Field
          label="Connect with sponsors?"
          error={errors.connectWithSponsors}
        >
          <YesNo
            name="connectWithSponsors"
            value={form.connectWithSponsors}
            onChange={(value) => update('connectWithSponsors', value)}
          />
        </Field>
        <Field
          label={`Resume link${form.connectWithSponsors ? '' : ' (optional)'}`}
          error={errors.resume}
        >
          <input
            type="url"
            className={inputClass}
            value={form.resume}
            onChange={(e) => update('resume', e.target.value)}
          />
        </Field>
        <Field
          label="Connect with HackDavis?"
          error={errors.connectWithHackDavis}
        >
          <YesNo
            name="connectWithHackDavis"
            value={form.connectWithHackDavis}
            onChange={(value) => update('connectWithHackDavis', value)}
          />
        </Field>
        <Field label="Connect with MLH?" error={errors.connectWithMLH}>
          <YesNo
            name="connectWithMLH"
            value={form.connectWithMLH}
            onChange={(value) => update('connectWithMLH', value)}
          />
        </Field>
        <Field label="MLH agreements" error={errors.mlhAgreements}>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.mlhCodeOfConduct}
              onChange={(e) => update('mlhCodeOfConduct', e.target.checked)}
            />
            MLH Code of Conduct
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.eventLogisticsInformation}
              onChange={(e) =>
                update('eventLogisticsInformation', e.target.checked)
              }
            />
            Event Logistics Information
          </label>
        </Field>
      </Section>

      {submitError && (
        <div
          role="alert"
          className="border border-red-600 bg-red-50 p-3 text-xs text-red-700"
        >
          <p>{submitError}</p>
          {isDuplicate && (
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border border-black p-4">
      <legend className="px-1 text-xs font-semibold uppercase">{title}</legend>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium">{label}</span>
      {children}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function Select({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

// Free text with suggestions, so admins can enter values missing from the lists.
function ListInput({
  id,
  options,
  value,
  disabled,
  onChange,
}: {
  id: string;
  options: string[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <input
        list={`late-acceptance-${id}`}
        className={inputClass}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={`late-acceptance-${id}`}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

function YesNo({
  name,
  value,
  disabled,
  onChange,
}: {
  name: string;
  value: YesNo;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex gap-4 text-xs">
      {[true, false].map((option) => (
        <label key={String(option)} className="flex items-center gap-1">
          <input
            type="radio"
            name={name}
            checked={value === option}
            disabled={disabled}
            onChange={() => onChange(option)}
          />
          {option ? 'Yes' : 'No'}
        </label>
      ))}
    </div>
  );
}

function Checkboxes({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[], toggled: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.includes(option)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, option]
                  : value.filter((v) => v !== option),
                option
              )
            }
          />
          {option}
        </label>
      ))}
    </div>
  );
}
