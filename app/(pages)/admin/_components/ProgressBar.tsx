'use client';

interface ProgressBarProps {
  processedCount: number;
  tentativeCount: number;
  totalCount: number;
}

export default function ProgressBar({
  processedCount,
  tentativeCount,
  totalCount,
}: ProgressBarProps) {
  const segments = [
    {
      label: 'processed',
      count: processedCount,
      fill: 'bg-green-700',
      text: 'text-green-900',
    },
    {
      label: 'tentative',
      count: tentativeCount,
      fill: 'bg-orange-500',
      text: 'text-orange-800',
    },
    {
      label: 'needs processing',
      count: Math.max(0, totalCount - processedCount - tentativeCount),
      fill: 'bg-blue-500',
      text: 'text-blue-900',
    },
  ];
  const activeSegments = segments.filter(({ count }) => count > 0);

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-medium">progress</h2>
        <span className="text-xs">total: {totalCount}</span>
      </div>
      <div className="flex h-2 w-full overflow-hidden bg-slate-200">
        {activeSegments.map(({ label, count, fill }) => (
          <div
            key={label}
            className={fill}
            style={{ width: `${(count / totalCount) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex text-xs">
        {activeSegments.map(({ label, count, text }) => (
          <div
            key={label}
            className="min-w-0 px-px text-center"
            style={{ width: `${(count / totalCount) * 100}%` }}
          >
            <span className={`font-semibold ${text}`}>{count}</span>
            <span className="block break-words">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-600">
        {segments
          .filter(({ count }) => count === 0)
          .map(({ label }) => (
            <span key={label}>{label}: 0</span>
          ))}
      </div>
    </section>
  );
}
