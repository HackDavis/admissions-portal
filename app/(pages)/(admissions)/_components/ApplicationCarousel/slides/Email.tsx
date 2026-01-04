import Image from "next/image";
// import Peeping from "public/Images/Peeping.svg"

export default function Email() {
  return (
    <section className="relative w-full">
        <div className="pointer-events-none absolute -left-10 top-0 hidden sm:block w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48">
            <Image
                src="/Images/Peeping.svg"
                alt="Animals peering from behind a wall."
                fill
                className="object-contain"
            />
        </div>

        <header className="text-center">
            <p className="text-sm tracking-wide text-[#005271]">APPLY TO PARTICIPATE IN</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#005271]">
            HACKDAVIS 2026
            </h1>
            <p className="mt-3 text-base font-medium text-[#173B47]">
            as a hacker, judge, mentor, or volunteer
            </p>
        </header>

      <div className="mt-12 flex flex-col items-center gap-8">
        <div className="w-full max-w-md">
          <input
            type="email"
            placeholder="Enter Email"
            className="w-full border-b-2 border-[#005271]/60 bg-transparent py-3 text-center text-xl outline-none placeholder:text-[#9FB6BE]"
          />
        </div>

        <button type="button" className="rounded-full bg-[#9FB6BE] px-8 py-3 text-white">
          Continue →
        </button>
      </div>
    </section>
  );
}
