// WIP WILL ADD COW ICON LATER
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <style>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          60% {
            width: 85%;
          }
          100% {
            width: 100%;
          }
        }

        .progress-fill {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-6">
        <p className="text-sm tracking-wide text-[#9FB6BE]">
          System online:
          <span className="ml-1 font-semibold text-black">
            future hacker incoming...
          </span>
        </p>

        {/* progress bar: BTW i manually made the pg load for 2 secs to get this viewable for dev */}
        <div className="relative h-4 w-72 rounded-full bg-[#E5E5E5]">
          <div className="progress-fill absolute left-0 top-0 h-full rounded-full bg-[#9FB6BE] flex items-center justify-end">
            <Image
              src="/Images/CowHead.svg"
              alt="HackDavis cow mascot head."
              width={40}
              height={40}
              className="h-19 w-19"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
