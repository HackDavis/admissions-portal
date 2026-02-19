export type YearDistribution = {
  first: number;
  second: number;
  third: number;
  fourth: number;
  fivePlus: number;
  unknown: number;
};

export type FirstTimeHackerCounts = {
  firstTime: number;
  nonFirstTime: number;
  unknown: number;
};

export type GenderCounts = {
  women: number;
  men: number;
  transgender: number;
  nonBinary: number;
  preferNotToAnswer: number;
  other: number;
  unknown: number;
};

export type MajorCount = {
  major: string;
  count: number;
};

export type StemCounts = {
  stem: number;
  nonStem: number;
  unknown: number;
};

export type ScopeStats = {
  totalApplicants: number;
  yearDistribution: YearDistribution;
  firstTimeHackers: FirstTimeHackerCounts;
  gender: GenderCounts;
  majorCounts: MajorCount[];
  stemVsNonStem: StemCounts;
};

export type AcceptanceRatio = {
  accepted: number;
  rejected: number;
  undecided: number;
  total: number;
};

export type PendingWaitlistedCounts = {
  pending: number;
  waitlisted: number;
};

export type AdminStats = {
  all: ScopeStats;
  processed: ScopeStats;
  hypothetic: ScopeStats;
  allQueueCounts: PendingWaitlistedCounts;
  acceptanceRatio: {
    processed: AcceptanceRatio;
    hypothetic: AcceptanceRatio;
  };
};
