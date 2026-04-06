'use client';

import Image from 'next/image';

export default function Closed() {
  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[980px] rounded-t-[28px] bg-white">
        <div className="px-6 pb-10 pt-10 sm:px-10 sm:pb-14 sm:pt-12 md:px-14 md:pb-16 md:pt-14">
          <h1 className="text-[30px] md:text-[48px] font-bold text-[#005271]">
            Applications are closed.
          </h1>

          <p className="mt-4 text-[#000] text-[16px] md:text-[24px]">
            Please visit{' '}
            <a
              href="https://hackdavis.io"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[#0F2530] underline-offset-4"
            >
              https://hackdavis.io
            </a>{' '}
            for more information.
          </p>
        </div>

        <div className="bg-[#E7EFF5] pt-3 sm:pt-4 md:pt-5">
          <Image
            src="/Images/ClosedMascots.svg"
            alt="HackDavis mascots in a closed applications illustration."
            width={1200}
            height={620}
            className="block h-auto w-full"
            priority
          />
        </div>
      </div>
    </section>
  );
}
