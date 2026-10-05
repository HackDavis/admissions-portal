import { Status } from './applicationFilters';

export interface ApplicationNote {
  _id: string;
  body: string;
  authorId: string;
  authorEmail: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export type WaitlistPool =
  | 'probable_accept'
  | 'probably_waitlist'
  | 'automatic';

export interface Application {
  decisionSource?: 'automatic' | 'manual';
  automaticReasons?: string[];
  waitlistPool?: WaitlistPool;
  _id: string;
  email: string; // required by mlh
  firstName: string; // required by mlh
  lastName: string; // required by mlh
  phone: string; // required by mlh
  age: number; // required by mlh
  isOver18: boolean; // required by mlh
  isUCDavisStudent: boolean;
  university: string; // required by mlh
  countryOfResidence: string; // required by mlh
  levelOfStudy: string; // required by mlh
  major: string;
  minorOrDoubleMajor?: string;
  college?: string[];
  year: '1' | '2' | '3' | '4' | '5+';
  shirtSize: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  dietaryRestrictions: string[];
  connectWithSponsors: boolean;
  gender?: string[];
  race?: string[];
  attendedHackDavis: boolean;
  firstHackathon: boolean;
  linkedin: string; // required by mlh
  githubOrPortfolio?: string;
  resume?: string;
  connectWithHackDavis: boolean;
  connectWithMLH: boolean; // required by mlh
  mlhAgreements: {
    mlhCodeOfConduct: boolean;
    eventLogisticsInformation: boolean;
  }; // required by mlh
  status: Status;
  wasWaitlisted: boolean;
  batchNumber?: number;
  submittedAt: Date | string;
  reviewedAt?: Date | string;
  processedAt?: Date | string;
  notes?: ApplicationNote[];
}

// Used for CSV exports
export interface ApplicationCondensed {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: Status;
}

export interface ApplicationUpdatePayload {
  waitlistPool?: WaitlistPool;
  status: Status;
  batchNumber?: number;
  wasWaitlisted?: boolean;
  reviewedAt?: Date | string;
  processedAt?: Date | string;
}
export type ApplicationStatusUpdateResult =
  | { ok: true }
  | { ok: false; error: string };

export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApplicationFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  isOver18: boolean | null;
  isUCDavisStudent: boolean | null;
  university: string;
  countryOfResidence: string;
  levelOfStudy: string;
  major: string;
  minorOrDoubleMajor: string;
  college: string[];
  year: number;
  shirtSize: string;
  dietaryRestrictions: string[];
  connectWithSponsors: boolean | null;
  gender: string[];
  race: string[];
  attendedHackDavis: boolean | null;
  firstHackathon: boolean | null;
  linkedin: string;
  githubOrPortfolio: string;
  resume: string;
  connectWithHackDavis: boolean | null;
  connectWithMLH: boolean | null;
  mlhAgreements: {
    mlhCodeOfConduct: boolean | null;
    eventLogisticsInformation: boolean | null;
  };
  status: string;
  wasWaitlisted: boolean;
  customUniversity: string;
}

export type ApplicationSubmissionPayload = Omit<
  ApplicationFormData,
  'customUniversity' | 'status'
> & {
  status: 'pending' | 'waitlisted';
};

export interface SubmitResult {
  ok: boolean;
  emailSent: boolean;
}
