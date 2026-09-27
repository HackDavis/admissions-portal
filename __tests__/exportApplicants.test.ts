import {
  exportAcceptedApplicants,
  exportRejectedWaitlistedApplicants,
} from '../app/(pages)/admin/_utils/exportAcceptedApplicants';
import { getApplicationsByStatuses } from '@utils/getFilteredApplications';
import { downloadCSV } from '../app/(pages)/admin/_utils/downloadCSV';

jest.mock('@utils/getFilteredApplications', () => ({
  getApplicationsByStatuses: jest.fn(),
}));
jest.mock('../app/(pages)/admin/_utils/downloadCSV', () => ({
  ...jest.requireActual('../app/(pages)/admin/_utils/downloadCSV'),
  downloadCSV: jest.fn(),
}));
const getApplicants = getApplicationsByStatuses as jest.Mock;
beforeEach(() => jest.clearAllMocks());

test('exports waitlisted and rejected applicants with readable labels and escaped fields', async () => {
  getApplicants.mockResolvedValue([
    {
      email: 'a@example.com',
      firstName: 'A,"B',
      lastName: 'Test',
      status: 'waitlisted',
    },
    {
      email: 'b@example.com',
      firstName: '=1+1',
      lastName: 'Test',
      status: 'waitlist_rejected',
    },
  ]);
  expect(await exportRejectedWaitlistedApplicants()).toBe(2);
  expect(getApplicants).toHaveBeenCalledWith([
    'waitlisted',
    'waitlist_rejected',
  ]);
  expect(downloadCSV).toHaveBeenCalledWith(
    expect.stringContaining('"A,""B","Test","Waitlisted"'),
    expect.stringMatching(/^rejected_waitlisted_applicants_.*\.csv$/)
  );
  expect(downloadCSV).toHaveBeenCalledWith(
    expect.stringContaining('"\'=1+1","Test","Rejected"'),
    expect.any(String)
  );
});

test('does not download an empty export', async () => {
  getApplicants.mockResolvedValue([]);
  expect(await exportRejectedWaitlistedApplicants()).toBe(0);
  expect(downloadCSV).not.toHaveBeenCalled();
});

test('propagates fetch failures without downloading', async () => {
  getApplicants.mockRejectedValue(new Error('Unauthorized'));
  await expect(exportRejectedWaitlistedApplicants()).rejects.toThrow(
    'Unauthorized'
  );
  expect(downloadCSV).not.toHaveBeenCalled();
});

test('keeps accepted export scoped to accepted statuses', async () => {
  getApplicants.mockResolvedValue([]);
  await exportAcceptedApplicants();
  expect(getApplicants).toHaveBeenCalledWith(['accepted', 'waitlist_accepted']);
});
