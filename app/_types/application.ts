import { Status } from './applicationFilters';

export interface Application {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  isOver18: boolean;
  isUCDavisStudent: boolean;
  university: string; //drop down options
  countryOfResidence: string;
  levelOfStudy: string; //drop down options
  major: string; //drop down options
  minorOrDoubleMajor: string; //drop down options
  college: string[];
  year: '1' | '2' | '3' | '4' | '5+';
  shirtSize: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  dietaryRestrictions: string[]; //section of options
  connectWithSponsors: boolean;
  gender: string[];
  race: string[];
  attendedHackDavis: boolean;
  firstHackathon: boolean;
  linkedin?: string;
  githubOrPortfolio?: string;
  resume: string;
  connectWithHackDavis: boolean;
  connectWithMLH: boolean;
  MLHCodeOfConduct: boolean;
  eventsLogistics: boolean;
  status: Status;
  wasWaitlisted: boolean;
  submittedAt: string;
  reviewedAt?: string;
  processedAt?: string;
}

export interface ApplicationUpdatePayload {
  status: Status;
  wasWaitlisted?: boolean;
  reviewedAt?: string; // ISO date string
  processedAt?: string; // ISO date string
}
