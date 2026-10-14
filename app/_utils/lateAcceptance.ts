import { Application } from '../_types/application';
import {
  COLLEGE_OPTIONS,
  DIETARY_OPTIONS,
  GENDER_OPTIONS,
  LEVEL_OF_STUDY_OPTIONS,
  RACE_OPTIONS,
} from '../_data/applicationOptions';
import validationData from '../_data/db_validation_data.json';

export const UC_DAVIS = 'University of California Davis';
export const YEAR_OPTIONS = validationData.years;
export const SHIRT_SIZE_OPTIONS = validationData.shirtSizes;

// Fields an admin enters by hand. Status, timestamps, and manual-entry
// metadata are set by the server, so they are not part of the form.
export type LateAcceptanceInput = Omit<
  Application,
  | '_id'
  | 'status'
  | 'wasWaitlisted'
  | 'batchNumber'
  | 'submittedAt'
  | 'reviewedAt'
  | 'processedAt'
  | 'notes'
  | 'decisionSource'
  | 'automaticReasons'
  | 'waitlistPool'
>;

export type LateAcceptanceFieldErrors = Partial<
  Record<keyof LateAcceptanceInput, string>
>;

// Contract for the #121 server action, matching the other application actions.
export type LateAcceptanceResult =
  | { ok: true; body: Application; error: null }
  | {
      ok: false;
      body: null;
      error: string;
      fieldErrors?: LateAcceptanceFieldErrors;
    };

export const DUPLICATE_APPLICATION_ERROR =
  'An application with this email already exists';

const REQUIRED_TEXT = [
  'email',
  'firstName',
  'lastName',
  'phone',
  'university',
  'countryOfResidence',
  'major',
  'linkedin',
] as const;

const REQUIRED_YES_NO = [
  'isOver18',
  'isUCDavisStudent',
  'attendedHackDavis',
  'firstHackathon',
  'connectWithSponsors',
  'connectWithHackDavis',
  'connectWithMLH',
] as const;

const SINGLE_CHOICE = {
  levelOfStudy: LEVEL_OF_STUDY_OPTIONS,
  year: YEAR_OPTIONS,
  shirtSize: SHIRT_SIZE_OPTIONS,
} as const;

const MULTI_CHOICE = {
  college: COLLEGE_OPTIONS,
  dietaryRestrictions: DIETARY_OPTIONS,
  gender: GENDER_OPTIONS,
  race: RACE_OPTIONS,
} as const;

const FORMATS: [keyof LateAcceptanceInput, RegExp, string][] = [
  ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address.'],
  // E.164, same format the public form stores
  ['phone', /^\+[1-9]\d{6,14}$/, 'Enter a valid phone number.'],
  [
    'linkedin',
    /^https?:\/\/(www\.)?linkedin\.com\/in\/.+$/,
    'Use the format https://www.linkedin.com/in/username.',
  ],
  ['githubOrPortfolio', /^\S+\.[a-z]{2,}(\/\S*)?$/i, 'Enter a valid URL.'],
  ['resume', /^\S+\.[a-z]{2,}(\/\S*)?$/i, 'Enter a valid URL.'],
];

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const isFilled = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0;

// Shared by the form and the server action so both enforce the same rules.
export function validateLateAcceptance(
  input: Partial<LateAcceptanceInput>
): LateAcceptanceFieldErrors {
  const errors: LateAcceptanceFieldErrors = {};

  for (const key of REQUIRED_TEXT) {
    if (!isFilled(input[key])) errors[key] = 'This field is required.';
  }
  for (const key of REQUIRED_YES_NO) {
    if (typeof input[key] !== 'boolean') errors[key] = 'Select yes or no.';
  }
  for (const [key, options] of Object.entries(SINGLE_CHOICE)) {
    const k = key as keyof typeof SINGLE_CHOICE;
    if (!options.includes(input[k] ?? '')) errors[k] = 'Select an option.';
  }
  for (const [key, options] of Object.entries(MULTI_CHOICE)) {
    const k = key as keyof typeof MULTI_CHOICE;
    const value = input[k];
    if (value !== undefined && !value.every((v) => options.includes(v)))
      errors[k] = 'Select valid options.';
  }
  for (const [key, regex, message] of FORMATS) {
    const value = input[key];
    if (!errors[key] && isFilled(value) && !regex.test(String(value).trim()))
      errors[key] = message;
  }

  const { age } = input;
  if (typeof age !== 'number' || !Number.isInteger(age) || age < 17 || age > 99)
    errors.age = 'Enter an age between 17 and 99.';
  else if (age >= 18 && input.isOver18 === false)
    errors.isOver18 = 'Applicants 18 or older must be marked as over 18.';

  const isUCDavis =
    input.isUCDavisStudent === true || input.university === UC_DAVIS;
  if (isUCDavis && !input.college?.length)
    errors.college = 'Select at least one college for UC Davis students.';

  const dietary = input.dietaryRestrictions ?? [];
  if (!dietary.length)
    errors.dietaryRestrictions = 'Select at least one option (or None).';
  else if (dietary.includes('None') && dietary.length > 1)
    errors.dietaryRestrictions =
      '"None" cannot be combined with other options.';

  if (input.connectWithSponsors === true && !isFilled(input.resume))
    errors.resume = 'A resume link is required to connect with sponsors.';

  if (
    input.mlhAgreements?.mlhCodeOfConduct !== true ||
    input.mlhAgreements?.eventLogisticsInformation !== true
  )
    errors.mlhAgreements = 'Both MLH agreements are required.';

  return errors;
}
