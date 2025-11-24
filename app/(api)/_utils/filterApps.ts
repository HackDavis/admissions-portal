import type { Application } from '../../_types/application';
import mockApplications from '../_data/mock-applications.json';

export interface SplitApplicationsResult {
  ucdStudents: Application[];
  nonUcdStudents: Application[];
}

// split a list of applications into UC Davis vs non UC Davis
export function splitApplicationsByUCDavis(
  applications: Application[],
): SplitApplicationsResult {
  const ucdStudents: Application[] = [];
  const nonUcdStudents: Application[] = [];

  for (const app of applications) {
    if (app.isUCDavisStudent) {
      ucdStudents.push(app);
    } else {
      nonUcdStudents.push(app);
    }
  }

  return { ucdStudents, nonUcdStudents };
}

// use the mock JSON as the "raw" input for testing
const mockApps = mockApplications as Application[];

export const {
  ucdStudents: mockUcdStudents,
  nonUcdStudents: mockNonUcdStudents,
} = splitApplicationsByUCDavis(mockApps);

