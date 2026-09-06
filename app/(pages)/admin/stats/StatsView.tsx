'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import useStats from '../_hooks/useStats';

type Scope = 'all' | 'processed' | 'hypothetic';

type ChartRow = {
  name: string;
  value: number;
};

const SCOPE_OPTIONS: Array<{ label: string; value: Scope }> = [
  { label: 'All Applicants', value: 'all' },
  { label: 'Processed', value: 'processed' },
  { label: 'Hypothetical (Processed + Tentative)', value: 'hypothetic' },
];

const PIE_COLORS = ['#1d4ed8', '#db2777', '#059669', '#9333ea', '#6b7280'];

export default function StatsView() {
  const { error, loading, refreshStats, stats } = useStats();
  const [scope, setScope] = useState<Scope>('all');

  const selectedScopeStats = stats?.[scope];

  const yearData: ChartRow[] = useMemo(() => {
    if (!selectedScopeStats) return [];

    return [
      { name: '1st', value: selectedScopeStats.yearDistribution.first },
      { name: '2nd', value: selectedScopeStats.yearDistribution.second },
      { name: '3rd', value: selectedScopeStats.yearDistribution.third },
      { name: '4th', value: selectedScopeStats.yearDistribution.fourth },
      { name: '5+', value: selectedScopeStats.yearDistribution.fivePlus },
    ];
  }, [selectedScopeStats]);

  const firstTimeData: ChartRow[] = useMemo(() => {
    if (!selectedScopeStats) return [];

    const rows: ChartRow[] = [
      {
        name: 'First Time',
        value: selectedScopeStats.firstTimeHackers.firstTime,
      },
      {
        name: 'Not First Time',
        value: selectedScopeStats.firstTimeHackers.nonFirstTime,
      },
    ];

    if (selectedScopeStats.firstTimeHackers.unknown > 0) {
      rows.push({
        name: 'Unknown',
        value: selectedScopeStats.firstTimeHackers.unknown,
      });
    }

    return rows;
  }, [selectedScopeStats]);

  const genderData: ChartRow[] = useMemo(() => {
    if (!selectedScopeStats) return [];

    const {
      men,
      women,
      transgender,
      nonBinary,
      preferNotToAnswer,
      other: otherGender,
      unknown,
    } = selectedScopeStats.gender;

    const otherOrUnknown =
      transgender + nonBinary + preferNotToAnswer + otherGender + unknown;

    const rows: ChartRow[] = [
      { name: 'Women', value: women },
      { name: 'Men', value: men },
    ];

    if (otherOrUnknown > 0) {
      rows.push({ name: 'Other/Unknown', value: otherOrUnknown });
    }

    return rows;
  }, [selectedScopeStats]);

  const majorData: ChartRow[] = useMemo(() => {
    if (!selectedScopeStats) return [];

    return selectedScopeStats.majorCounts.slice(0, 10).map((item) => ({
      name: item.major,
      value: item.count,
    }));
  }, [selectedScopeStats]);

  const stemData: ChartRow[] = useMemo(() => {
    if (!selectedScopeStats) return [];

    const rows: ChartRow[] = [
      { name: 'STEM', value: selectedScopeStats.stemVsNonStem.stem },
      { name: 'Non-STEM', value: selectedScopeStats.stemVsNonStem.nonStem },
    ];

    if (selectedScopeStats.stemVsNonStem.unknown > 0) {
      rows.push({
        name: 'Unknown',
        value: selectedScopeStats.stemVsNonStem.unknown,
      });
    }

    return rows;
  }, [selectedScopeStats]);

  const acceptanceData: ChartRow[] = useMemo(() => {
    if (!stats) return [];

    if (scope === 'all') {
      return [
        {
          name: 'Accepted',
          value: stats.acceptanceRatio.hypothetic.accepted,
        },
        {
          name: 'Rejected',
          value: stats.acceptanceRatio.hypothetic.rejected,
        },
        {
          name: 'Undecided',
          value: stats.acceptanceRatio.hypothetic.undecided,
        },
        { name: 'Pending', value: stats.allQueueCounts.pending },
        { name: 'Waitlisted', value: stats.allQueueCounts.waitlisted },
      ];
    }

    const ratio =
      scope === 'processed'
        ? stats.acceptanceRatio.processed
        : stats.acceptanceRatio.hypothetic;

    return [
      { name: 'Accepted', value: ratio.accepted },
      { name: 'Rejected', value: ratio.rejected },
      { name: 'Undecided', value: ratio.undecided },
    ];
  }, [scope, stats]);

  return (
    <section className="mb-6 border-2 border-black p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-semibold uppercase">Stats</h2>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={scope}
            aria-label="Filter statistics by scope"
            onChange={(e) => setScope(e.target.value as Scope)}
            className="border border-black bg-white px-3 py-1 text-xs"
          >
            {SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={refreshStats}
            className="border border-black px-3 py-1 text-xs uppercase"
          >
            refresh
          </button>
        </div>
      </div>

      {loading && <p className="text-xs">Loading stats...</p>}
      {!loading && error && <p className="text-xs">{error}</p>}

      {!loading && !error && selectedScopeStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <ChartCard title="Year Distribution">
            <BarChartBlock data={yearData} />
          </ChartCard>

          <ChartCard title="First Time Hacker Ratio">
            <PieChartBlock data={firstTimeData} />
          </ChartCard>

          <ChartCard title="Gender Ratio">
            <PieChartBlock data={genderData} />
          </ChartCard>

          <ChartCard title="Majors (Top 10)">
            <HorizontalBarChartBlock data={majorData} />
          </ChartCard>

          <ChartCard title="STEM vs Non-STEM">
            <PieChartBlock data={stemData} />
          </ChartCard>

          <ChartCard title="Acceptance / Rejection Ratio">
            <PieChartBlock data={acceptanceData} />
          </ChartCard>
        </div>
      )}
    </section>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="flex min-h-72 flex-col border border-black p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase">{title}</h3>
      <div className="flex-1">{children}</div>
    </article>
  );
}

function BarChartBlock({
  data,
  rotateLabels = false,
}: {
  data: ChartRow[];
  rotateLabels?: boolean;
}) {
  if (!data.length || data.every((item) => item.value === 0)) {
    return <p className="text-xs text-gray-600">No data.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: rotateLabels ? 55 : 15,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            interval={0}
            angle={rotateLabels ? -25 : 0}
            textAnchor={rotateLabels ? 'end' : 'middle'}
            height={rotateLabels ? 60 : 30}
            tick={{ fontSize: 11 }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#111827" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartBlock({ data }: { data: ChartRow[] }) {
  const filteredData = data.filter((item) => item.value > 0);

  if (!filteredData.length) {
    return <p className="text-xs text-gray-600">No data.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filteredData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius={65}
            label={(entry) => `${entry.name}: ${entry.value}`}
          >
            {filteredData.map((item, index) => (
              <Cell
                key={`${item.name}-${item.value}`}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={30} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function HorizontalBarChartBlock({ data }: { data: ChartRow[] }) {
  if (!data.length || data.every((item) => item.value === 0)) {
    return <p className="text-xs text-gray-600">No data.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={125}
            tick={{ fontSize: 10 }}
            interval={0}
          />
          <Tooltip />
          <Bar
            dataKey="value"
            fill="#111827"
            radius={[0, 2, 2, 0]}
            activeBar={<Rectangle fill="#1f2937" stroke="#111827" />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
