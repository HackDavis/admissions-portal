// import Image from "next/image";

type ApplicationFrameProps = {
  children: React.ReactNode;
};

export function ApplicationFrame({ children }: ApplicationFrameProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="relative rounded-[28px] bg-[#E9F1F3] p-3 shadow-[18px_18px_0_rgba(0,82,113,0.25)]">
        <div className="relative h-10 rounded-[20px] bg-[#DFF0F3]">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="h-4 w-10 rounded-full border-2 border-[#005271] bg-[#9EE7E5]" />
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="h-3.5 w-3.5 rounded-full bg-[#005271]" />
            ))}
          </div>
        </div>

        <div className="relative mt-3 rounded-[22px] bg-white px-6 py-10 sm:px-10 sm:py-14 overflow-hidden">
          <div className="pointer-events-none absolute -left-10 top-6 hidden sm:block">
            <div className="h-44 w-44 rounded-full bg-[#FFD84D]">
                placehodler for the animals
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
