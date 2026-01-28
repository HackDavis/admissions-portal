import { Status } from './applicationFilters';

export interface Application {
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
  resume: string;
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
}

export interface ApplicationUpdatePayload {
  status: Status;
  batchNumber?: number;
  wasWaitlisted?: boolean;
  reviewedAt?: Date | string;
  processedAt?: Date | string;
}
