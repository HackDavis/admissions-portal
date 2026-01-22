type ApplicationFrameProps = {
  children: React.ReactNode;
  topRight?: React.ReactNode; // for the indicators
  // leftDecor?: React.ReactNode; // for the animals
};

export function ApplicationFrame({
  children,
  topRight, // leftDecor,
}: ApplicationFrameProps) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="relative rounded-[28px] border-[#A6BFC7] border bg-[#E5EEF1] p-3 shadow-[18px_18px_0_#A6BFC7]">
        {/* top bar */}
        <div className="relative h-10 rounded-[20px]">
          {topRight ? (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              {topRight}
            </div>
          ) : null}
        </div>

        {/* white panel */}
        <div className="relative mt-3 rounded-[22px] py-10 bg-white overflow-visible">
          {/* decor sits OUTSIDE embla viewport so it won't be clipped */}
          {/* {leftDecor} */}

          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
