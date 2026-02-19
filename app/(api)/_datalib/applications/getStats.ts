import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { HttpError } from '@utils/response/Errors';
import {
  PROCESSED_STATUSES,
  HYPOTHETIC_STATUSES,
  ACCEPTED_STATUSES,
  REJECTED_STATUSES,
  UNDECIDED_STATUSES,
} from '@/app/_types/applicationFilters';
import {
  AdminStats,
  AcceptanceRatio,
  FirstTimeHackerCounts,
  GenderCounts,
  MajorCount,
  ScopeStats,
  StemCounts,
  YearDistribution,
  PendingWaitlistedCounts,
} from '@/app/_types/stats';

type ScopeKey = 'all' | 'processed' | 'hypothetic';

type AdminStatsRecord = {
  year?: string;
  firstHackathon?: boolean;
  gender?: string[];
  major?: string;
  status?: string;
};

const STEM_KEYWORDS = [
  'engineering',
  'computer',
  'informatics',
  'software',
  'cyber',
  'data',
  'mathematics',
  'math',
  'statistics',
  'physics',
  'chem',
  'biology',
  'bio',
  'neuroscience',
  'astronomy',
  'geology',
  'geophysics',
  'environmental science',
  'technology',
  'science',
] as const;

function getScopeQuery(scope: ScopeKey) {
  if (scope === 'processed') {
    return { status: { $in: [...PROCESSED_STATUSES] } };
  }

  if (scope === 'hypothetic') {
    return { status: { $in: [...HYPOTHETIC_STATUSES] } };
  }

  return {};
}

function createDefaultYearDistribution(): YearDistribution {
  return {
    first: 0,
    second: 0,
    third: 0,
    fourth: 0,
    fivePlus: 0,
    unknown: 0,
  };
}

function createDefaultGenderCounts(): GenderCounts {
  return {
    women: 0,
    men: 0,
    transgender: 0,
    nonBinary: 0,
    preferNotToAnswer: 0,
    other: 0,
    unknown: 0,
  };
}

function normalizeGenderBucket(genderValues?: string[]): keyof GenderCounts {
  if (!Array.isArray(genderValues) || genderValues.length === 0) {
    return 'unknown';
  }

  const normalized = genderValues.map((value) => value.toLowerCase().trim());

  if (normalized.includes('woman')) return 'women';
  if (normalized.includes('man')) return 'men';
  if (normalized.includes('transgender')) return 'transgender';
  if (
    normalized.includes('non-binary or non-conforming') ||
    normalized.includes('non-binary')
  ) {
    return 'nonBinary';
  }
  if (normalized.includes('prefer not to answer')) return 'preferNotToAnswer';
  if (normalized.includes('other')) return 'other';

  return 'unknown';
}

function normalizeMajorValue(major?: string) {
  if (!major || !major.trim()) {
    return 'Unknown';
  }

  return major.trim();
}

function isStemMajor(major: string): boolean | null {
  const normalized = major.toLowerCase().trim();
  if (!normalized || normalized === 'unknown') {
    return null;
  }

  return STEM_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function computeScopeStats(records: AdminStatsRecord[]): ScopeStats {
  const yearDistribution = createDefaultYearDistribution();
  const firstTimeHackers: FirstTimeHackerCounts = {
    firstTime: 0,
    nonFirstTime: 0,
    unknown: 0,
  };
  const gender = createDefaultGenderCounts();
  const majorAccumulator = new Map<string, number>();
  const stemVsNonStem: StemCounts = {
    stem: 0,
    nonStem: 0,
    unknown: 0,
  };

  for (const record of records) {
    const year = (record.year ?? '').trim();
    if (year === '1') yearDistribution.first += 1;
    else if (year === '2') yearDistribution.second += 1;
    else if (year === '3') yearDistribution.third += 1;
    else if (year === '4') yearDistribution.fourth += 1;
    else if (year === '5+') yearDistribution.fivePlus += 1;
    else yearDistribution.unknown += 1;

    if (record.firstHackathon === true) {
      firstTimeHackers.firstTime += 1;
    } else if (record.firstHackathon === false) {
      firstTimeHackers.nonFirstTime += 1;
    } else {
      firstTimeHackers.unknown += 1;
    }

    const genderBucket = normalizeGenderBucket(record.gender);
    gender[genderBucket] += 1;

    const major = normalizeMajorValue(record.major);
    majorAccumulator.set(major, (majorAccumulator.get(major) ?? 0) + 1);

    const stemClassification = isStemMajor(major);
    if (stemClassification === true) stemVsNonStem.stem += 1;
    else if (stemClassification === false) stemVsNonStem.nonStem += 1;
    else stemVsNonStem.unknown += 1;
  }

  const majorCounts: MajorCount[] = [...majorAccumulator.entries()]
    .map(([major, count]) => ({ major, count }))
    .sort((a, b) => b.count - a.count || a.major.localeCompare(b.major));

  return {
    totalApplicants: records.length,
    yearDistribution,
    firstTimeHackers,
    gender,
    majorCounts,
    stemVsNonStem,
  };
}

function computeAcceptanceRatio(records: AdminStatsRecord[]): AcceptanceRatio {
  let accepted = 0;
  let rejected = 0;
  let undecided = 0;

  for (const record of records) {
    const status = record.status;
    if (!status) continue;

    if (ACCEPTED_STATUSES.has(status)) accepted += 1;
    else if (REJECTED_STATUSES.has(status)) rejected += 1;
    else if (UNDECIDED_STATUSES.has(status)) undecided += 1;
  }

  return {
    accepted,
    rejected,
    undecided,
    total: accepted + rejected + undecided,
  };
}

function computePendingWaitlistedCounts(
  records: AdminStatsRecord[]
): PendingWaitlistedCounts {
  let pending = 0;
  let waitlisted = 0;

  for (const record of records) {
    if (record.status === 'pending') pending += 1;
    else if (record.status === 'waitlisted') waitlisted += 1;
  }

  return { pending, waitlisted };
}

async function fetchScopeRecords(scope: ScopeKey) {
  const db = await getDatabase();

  const applications = await db
    .collection('applications')
    .find(getScopeQuery(scope), {
      projection: {
        year: 1,
        firstHackathon: 1,
        gender: 1,
        major: 1,
        status: 1,
      },
    })
    .toArray();

  return applications as AdminStatsRecord[];
}

export const GetApplicationStats = async () => {
  try {
    const [allRecords, processedRecords, hypotheticRecords] = await Promise.all(
      [
        fetchScopeRecords('all'),
        fetchScopeRecords('processed'),
        fetchScopeRecords('hypothetic'),
      ]
    );

    const response: AdminStats = {
      all: computeScopeStats(allRecords),
      processed: computeScopeStats(processedRecords),
      hypothetic: computeScopeStats(hypotheticRecords),
      allQueueCounts: computePendingWaitlistedCounts(allRecords),
      acceptanceRatio: {
        processed: computeAcceptanceRatio(processedRecords),
        hypothetic: computeAcceptanceRatio(hypotheticRecords),
      },
    };

    return {
      ok: true,
      body: response,
      error: null,
    };
  } catch (e) {
    const error = e as HttpError;
    return {
      ok: false,
      body: null,
      error: error.message,
    };
  }
};
