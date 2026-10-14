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
export type LateAcceptanceInput = Pick<
  Application,
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'phone'
  | 'age'
  | 'isOver18'
  | 'isUCDavisStudent'
  | 'university'
  | 'countryOfResidence'
  | 'levelOfStudy'
  | 'major'
  | 'minorOrDoubleMajor'
  | 'college'
  | 'year'
  | 'shirtSize'
  | 'dietaryRestrictions'
  | 'connectWithSponsors'
  | 'gender'
  | 'race'
  | 'attendedHackDavis'
  | 'firstHackathon'
  | 'linkedin'
  | 'githubOrPortfolio'
  | 'resume'
  | 'connectWithHackDavis'
  | 'connectWithMLH'
  | 'mlhAgreements'
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/; // E.164, same format the public form stores
const LINKEDIN_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/.+$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidUrl(value: string) {
  try {
    const url = new URL(
      /^https?:\/\//i.test(value) ? value : `https://${value}`
    );
    return /\.[a-z]{2,}$/i.test(url.hostname);
  } catch {
    return false;
  }
}

const isBool = (value: unknown) => typeof value === 'boolean';
const isFilled = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0;
const allIn = (values: unknown, options: readonly string[]) =>
  Array.isArray(values) && values.every((v) => options.includes(v));

// Shared by the form and the server action so both enforce the same rules.
export function validateLateAcceptance(
  input: Partial<LateAcceptanceInput>
): LateAcceptanceFieldErrors {
  const errors: LateAcceptanceFieldErrors = {};
  const yesNo = 'Select yes or no.';

  if (!isFilled(input.email)) errors.email = 'Email is required.';
  else if (!EMAIL_REGEX.test(normalizeEmail(input.email!)))
    errors.email = 'Enter a valid email address.';

  if (!isFilled(input.firstName)) errors.firstName = 'First name is required.';
  if (!isFilled(input.lastName)) errors.lastName = 'Last name is required.';

  if (!isFilled(input.phone)) errors.phone = 'Phone number is required.';
  else if (!PHONE_REGEX.test(input.phone!))
    errors.phone = 'Enter a valid phone number.';

  if (typeof input.age !== 'number' || !Number.isInteger(input.age))
    errors.age = 'Age is required.';
  else if (input.age < 17 || input.age > 99)
    errors.age = 'Age must be between 17 and 99.';

  if (!isBool(input.isOver18)) errors.isOver18 = yesNo;
  else if (typeof input.age === 'number' && input.age >= 18 && !input.isOver18)
    errors.isOver18 = 'Applicants 18 or older must be marked as over 18.';

  if (!isBool(input.isUCDavisStudent)) errors.isUCDavisStudent = yesNo;
  if (!isFilled(input.university))
    errors.university = 'University is required.';
  if (!isFilled(input.countryOfResidence))
    errors.countryOfResidence = 'Country of residence is required.';

  if (!LEVEL_OF_STUDY_OPTIONS.includes(input.levelOfStudy ?? ''))
    errors.levelOfStudy = 'Select a level of study.';
  if (!isFilled(input.major)) errors.major = 'Major is required.';

  const isUCDavis =
    input.isUCDavisStudent === true || input.university === UC_DAVIS;
  if (input.college !== undefined && !allIn(input.college, COLLEGE_OPTIONS))
    errors.college = 'Select a valid college.';
  else if (isUCDavis && !input.college?.length)
    errors.college = 'Select at least one college for UC Davis students.';

  if (!YEAR_OPTIONS.includes(input.year ?? '')) errors.year = 'Select a year.';
  if (!SHIRT_SIZE_OPTIONS.includes(input.shirtSize ?? ''))
    errors.shirtSize = 'Select a shirt size.';

  if (
    !allIn(input.dietaryRestrictions, DIETARY_OPTIONS) ||
    !input.dietaryRestrictions?.length
  )
    errors.dietaryRestrictions = 'Select at least one option (or None).';
  else if (
    input.dietaryRestrictions.includes('None') &&
    input.dietaryRestrictions.length > 1
  )
    errors.dietaryRestrictions =
      '"None" cannot be combined with other options.';

  if (input.gender !== undefined && !allIn(input.gender, GENDER_OPTIONS))
    errors.gender = 'Select valid gender options.';
  if (input.race !== undefined && !allIn(input.race, RACE_OPTIONS))
    errors.race = 'Select valid race options.';

  if (!isBool(input.attendedHackDavis)) errors.attendedHackDavis = yesNo;
  if (!isBool(input.firstHackathon)) errors.firstHackathon = yesNo;

  if (!isFilled(input.linkedin)) errors.linkedin = 'LinkedIn is required.';
  else if (!LINKEDIN_REGEX.test(input.linkedin!))
    errors.linkedin = 'Use the format https://www.linkedin.com/in/username.';

  if (
    isFilled(input.githubOrPortfolio) &&
    !isValidUrl(input.githubOrPortfolio!)
  )
    errors.githubOrPortfolio = 'Enter a valid URL.';

  if (!isBool(input.connectWithSponsors)) errors.connectWithSponsors = yesNo;
  if (isFilled(input.resume)) {
    if (!isValidUrl(input.resume!)) errors.resume = 'Enter a valid URL.';
  } else if (input.connectWithSponsors === true) {
    errors.resume = 'A resume link is required to connect with sponsors.';
  }

  if (!isBool(input.connectWithHackDavis)) errors.connectWithHackDavis = yesNo;
  if (!isBool(input.connectWithMLH)) errors.connectWithMLH = yesNo;
  if (
    input.mlhAgreements?.mlhCodeOfConduct !== true ||
    input.mlhAgreements?.eventLogisticsInformation !== true
  )
    errors.mlhAgreements = 'Both MLH agreements are required.';

  return errors;
}
