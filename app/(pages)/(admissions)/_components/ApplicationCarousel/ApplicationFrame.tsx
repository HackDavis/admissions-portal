type ApplicationFrameProps = {
  children: React.ReactNode;
  topRight?: React.ReactNode; // for the indicators 
};

export function ApplicationFrame({ children, topRight }: ApplicationFrameProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="relative rounded-[28px] bg-[#E9F1F3] p-3 shadow-[18px_18px_0_rgba(0,82,113,0.25)]">
        {/* top bar */}
        <div className="relative h-10 rounded-[20px] bg-[#DFF0F3]">
          {topRight ? (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              {topRight}
            </div>
          ) : null}
        </div>

        <div className="relative mt-3 rounded-[22px] bg-white px-6 py-10 sm:px-10 sm:py-14 overflow-hidden">
          <div className="pointer-events-none absolute -left-10 top-6 hidden sm:block">
            <div className="h-44 w-44 rounded-full bg-[#FFD84D]">
              placehodler for the animals
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
