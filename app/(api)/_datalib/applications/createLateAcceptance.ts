import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { findApplicationByEmail } from './createApplication';
import {
  DUPLICATE_APPLICATION_ERROR,
  LateAcceptanceFieldErrors,
  LateAcceptanceInput,
  LateAcceptanceResult,
  normalizeEmail,
  validateLateAcceptance,
} from '../../../_utils/lateAcceptance';
import type { Application } from '../../../_types/application';

const STRING_FIELDS = [
  'email',
  'firstName',
  'lastName',
  'phone',
  'university',
  'countryOfResidence',
  'levelOfStudy',
  'major',
  'minorOrDoubleMajor',
  'year',
  'shirtSize',
  'linkedin',
  'githubOrPortfolio',
  'resume',
] as const;

const BOOLEAN_FIELDS = [
  'isOver18',
  'isUCDavisStudent',
  'connectWithSponsors',
  'attendedHackDavis',
  'firstHackathon',
  'connectWithHackDavis',
  'connectWithMLH',
] as const;

const ARRAY_FIELDS = [
  'college',
  'dietaryRestrictions',
  'gender',
  'race',
] as const;

const INVALID_INPUT_ERROR = 'Some fields are missing or invalid.';

// Copies only the form's fields so a client cannot set status, timestamps, or
// manual-entry metadata, and drops values of the wrong type before validation.
function sanitize(raw: Record<string, unknown>) {
  const input: Record<string, unknown> = {};
  const typeErrors: LateAcceptanceFieldErrors = {};

  for (const key of STRING_FIELDS) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) input[key] = value.trim();
  }
  for (const key of BOOLEAN_FIELDS) {
    if (typeof raw[key] === 'boolean') input[key] = raw[key];
  }
  for (const key of ARRAY_FIELDS) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.every((v) => typeof v === 'string'))
      input[key] = value;
    else typeErrors[key] = 'Select valid options.';
  }
  if (typeof raw.age === 'number') input.age = raw.age;

  const mlh = raw.mlhAgreements as Record<string, unknown> | undefined;
  input.mlhAgreements = {
    mlhCodeOfConduct: mlh?.mlhCodeOfConduct === true,
    eventLogisticsInformation: mlh?.eventLogisticsInformation === true,
  };

  if (typeof input.email === 'string')
    input.email = normalizeEmail(input.email);

  return { input: input as Partial<LateAcceptanceInput>, typeErrors };
}

const fail = (
  error: string,
  fieldErrors?: LateAcceptanceFieldErrors
): LateAcceptanceResult => ({ ok: false, body: null, error, fieldErrors });

export const CreateLateAcceptance = async (
  raw: unknown,
  admin: { id: string; email: string }
): Promise<LateAcceptanceResult> => {
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return fail('No application data was sent.');
    }

    const { input, typeErrors } = sanitize(raw as Record<string, unknown>);
    const fieldErrors = { ...validateLateAcceptance(input), ...typeErrors };
    if (Object.keys(fieldErrors).length > 0) {
      return fail(INVALID_INPUT_ERROR, fieldErrors);
    }

    const db = await getDatabase();

    if (await findApplicationByEmail(db, input.email as string)) {
      return fail(DUPLICATE_APPLICATION_ERROR, {
        email: DUPLICATE_APPLICATION_ERROR,
      });
    }

    // The admin is accepting directly, so this skips the auto waitlist and the
    // public submission deadline. Nothing here sends email: the applicant is
    // picked up by the usual RSVP and Hub invite flows like any other
    // accepted applicant.
    const now = new Date();
    const application = {
      ...input,
      status: 'accepted',
      wasWaitlisted: false,
      decisionSource: 'manual',
      automaticReasons: [],
      submittedAt: now,
      reviewedAt: now,
      processedAt: now,
      manualEntry: {
        addedById: admin.id,
        addedByEmail: admin.email,
        addedAt: now,
      },
    };

    const { insertedId } = await db
      .collection('applications')
      .insertOne(application);

    return {
      ok: true,
      body: { ...application, _id: String(insertedId) } as Application,
      error: null,
    };
  } catch (e) {
    // A unique index on email (if present) can still reject a concurrent insert.
    if ((e as { code?: number })?.code === 11000) {
      return fail(DUPLICATE_APPLICATION_ERROR, {
        email: DUPLICATE_APPLICATION_ERROR,
      });
    }
    console.error('Error creating late acceptance:', e);
    return fail('Could not save the application. Please try again.');
  }
};
