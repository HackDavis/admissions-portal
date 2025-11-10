export interface Application {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  isUCDavisStudent: boolean;
  university: string; //drop down options
  levelOfStudy: string; //drop down options
  major: string; //drop down options
  minorOrDoubleMajor?: string; //drop down options
  college: string[];
  year: '1' | '2' | '3' | '4' | '5+';
  shirtSize: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  dietaryRestrictions: string[]; //section of options
  connectWithSponsors: boolean;
  resume: string;
  linkedin?: string;
  githubOrPortfolio?: string;
  connectWithHackDavis: boolean;
  connectWithMLH?: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'waitlisted';
  submittedAt: string;
  reviewedAt?: string;
}
