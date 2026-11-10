/** @jest-environment node */
import { CreateLateAcceptance } from '@datalib/applications/createLateAcceptance';
import { createLateAcceptance } from '@actions/applications/createLateAcceptance';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { auth } from '@/auth';
import { DUPLICATE_APPLICATION_ERROR } from '../app/_utils/lateAcceptance';

jest.mock('@utils/mongodb/mongoClient.mjs', () => ({ getDatabase: jest.fn() }));
jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const findOne = jest.fn();
const insertOne = jest.fn();
(getDatabase as jest.Mock).mockResolvedValue({
  collection: () => ({ findOne, insertOne }),
});

const admin = { id: 'admin-1', email: 'admin@hackdavis.io' };

const validInput = {
  email: '  New.Person@Example.COM ',
  firstName: 'New',
  lastName: 'Person',
  phone: '+15305551234',
  age: 20,
  isOver18: true,
  isUCDavisStudent: false,
  university: 'Stanford University',
  countryOfResidence: 'United States',
  levelOfStudy: 'Graduate University (Masters, Professional, Doctoral, etc)',
  major: 'Computer Science',
  year: '4',
  shirtSize: 'M',
  dietaryRestrictions: ['None'],
  connectWithSponsors: false,
  attendedHackDavis: false,
  firstHackathon: true,
  linkedin: 'https://www.linkedin.com/in/newperson',
  connectWithHackDavis: true,
  connectWithMLH: true,
  mlhAgreements: { mlhCodeOfConduct: true, eventLogisticsInformation: true },
};

beforeEach(() => {
  findOne.mockResolvedValue(null);
  insertOne.mockResolvedValue({ insertedId: 'abc123' });
});

test('saves an accepted application with manual-entry metadata', async () => {
  const res = await CreateLateAcceptance(
    { ...validInput, status: 'pending', manualEntry: { addedById: 'x' } },
    admin
  );

  expect(res.ok).toBe(true);
  const saved = insertOne.mock.calls[0][0];
  expect(saved).toMatchObject({
    email: 'new.person@example.com',
    status: 'accepted',
    wasWaitlisted: false,
    decisionSource: 'manual',
    automaticReasons: [],
    manualEntry: { addedById: 'admin-1', addedByEmail: admin.email },
  });
  // Grad students are normally auto waitlisted; an explicit acceptance skips that.
  expect(saved.waitlistPool).toBeUndefined();
  expect(saved.submittedAt).toBeInstanceOf(Date);
  expect(saved.reviewedAt).toBe(saved.submittedAt);
  expect(saved.manualEntry.addedAt).toBe(saved.submittedAt);
  expect(res.body?._id).toBe('abc123');
});

test('rejects duplicates without writing', async () => {
  findOne.mockResolvedValue({ _id: 'existing' });

  const res = await CreateLateAcceptance(validInput, admin);

  expect(res).toMatchObject({
    ok: false,
    error: DUPLICATE_APPLICATION_ERROR,
    fieldErrors: { email: DUPLICATE_APPLICATION_ERROR },
  });
  expect(findOne.mock.calls[0][0].email.$options).toBe('i');
  expect(insertOne).not.toHaveBeenCalled();
});

test('returns field errors for missing or invalid fields', async () => {
  const res = await CreateLateAcceptance(
    {
      ...validInput,
      firstName: '   ',
      age: '20',
      gender: 'not-an-array',
      mlhAgreements: undefined,
    },
    admin
  );

  expect(res.ok).toBe(false);
  if (res.ok) return;
  expect(Object.keys(res.fieldErrors ?? {})).toEqual(
    expect.arrayContaining(['firstName', 'age', 'gender', 'mlhAgreements'])
  );
  expect(getDatabase).not.toHaveBeenCalled();
});

test('rejects non-object bodies', async () => {
  const res = await CreateLateAcceptance(null, admin);
  expect(res.ok).toBe(false);
});

test('server action refuses non-admins', async () => {
  (auth as jest.Mock).mockResolvedValue({ user: { role: 'hacker' } });

  const res = await createLateAcceptance(validInput);

  expect(res).toEqual({ ok: false, body: null, error: 'Unauthorized' });
  expect(insertOne).not.toHaveBeenCalled();
});

test('server action records the admin from the session', async () => {
  (auth as jest.Mock).mockResolvedValue({ user: { ...admin, role: 'admin' } });

  const res = await createLateAcceptance(validInput);

  expect(res.ok).toBe(true);
  expect(insertOne.mock.calls[0][0].manualEntry.addedByEmail).toBe(admin.email);
});
