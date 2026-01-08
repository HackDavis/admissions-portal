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
  const processedPct = totalCount ? (processedCount / totalCount) * 100 : 0;
  const tentativePct = totalCount ? (tentativeCount / totalCount) * 100 : 0;
  const unseenPct = Math.max(0, 100 - processedPct - tentativePct);

  return (
    <section className="mb-4">
      <h2 className="pb-4 font-medium">progress</h2>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span>
          processed:{' '}
          <span className="font-semibold text-blue-900">{processedCount}</span>
        </span>
        <span>
          tentative:{' '}
          <span className="font-semibold text-blue-400">{tentativeCount}</span>
        </span>
        <span>total: {totalCount}</span>
      </div>

      <div className="h-2 w-full overflow-hidden border-2 border-black bg-slate-200">
        <div className="flex h-full">
          <div
            className="h-full bg-blue-900"
            style={{ width: `${processedPct}%` }}
          />
          <div
            className="h-full bg-blue-200"
            style={{ width: `${tentativePct}%` }}
          />
          <div className="h-full bg-white" style={{ width: `${unseenPct}%` }} />
        </div>
      </div>
    </section>
  );
}
