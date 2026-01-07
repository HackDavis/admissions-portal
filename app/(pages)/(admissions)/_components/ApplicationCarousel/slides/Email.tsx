import Image from 'next/image';

interface EmailProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext?: () => void;
}

export default function Email({ formData, setFormData, onNext }: EmailProps) {
  const isValidEdu =
    formData.email.endsWith('.edu') && formData.email.includes('@');

  return (
    <section className="relative w-full">
      <header className="text-center">
        <Image
          src="/Images/HDLogo.svg"
          alt="HackDavis Logo"
          width={100}
          height={100}
          className="mx-auto py-6"
        />
        <p className="text-sm tracking-wide text-[#005271]">
          APPLY TO PARTICIPATE IN
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#005271]">
          HACKDAVIS 2026
        </h1>
        <p className="mt-3 text-base font-medium text-[#173B47]">as a hacker</p>
      </header>

      <div className="mt-12 flex flex-col items-center gap-8">
        <div className="w-full max-w-md">
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Enter School Email (.edu)"
            className="w-full border-b-2 border-[#005271]/60 bg-transparent py-3 text-center text-xl outline-none placeholder:text-[#9FB6BE]"
          />
        </div>

        <button
          type="button"
          disabled={!isValidEdu}
          onClick={onNext}
          className={`rounded-full px-8 py-3 text-white ${
            isValidEdu ? 'bg-[#005271]' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Access Portal →
        </button>
      </div>
    </section>
  );
}
