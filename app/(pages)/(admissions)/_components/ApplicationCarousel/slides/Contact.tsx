"use client";

import * as React from "react";

type FieldId = "firstName" | "lastName" | "phone" | "position";

type Question = {
  id: FieldId;
  label: string;
  required?: boolean;
};

const QUESTIONS: Question[] = [
  { id: "firstName", label: "First Name", required: true },
  { id: "lastName", label: "Last Name", required: true },
  { id: "phone", label: "Phone number", required: true },
  { id: "position", label: "Position", required: false },
];

export default function Contact() {
  const [values, setValues] = React.useState<Record<FieldId, string>>({
    firstName: "",
    lastName: "",
    phone: "",
    position: "",
  });

  const [submitted, setSubmitted] = React.useState(false);

  const onChange =
    (id: FieldId) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [id]: e.target.value }));
    };

  const handleNext = () => {
    setSubmitted(true);

    const missingRequired = QUESTIONS.some(
      (q) => q.required && values[q.id].trim() === ""
    );
    if (missingRequired) return;

  };

  return (
    <section className="w-full">
        <header className="text-center">
            <h1 className="text-center text-[48px] text-[#005271] font-bold leading-[1] tracking-[0.01em]">
            Help us get to
            <br />
            know you better!
            </h1>
        </header>

      <div className="mx-auto mt-12 w-full max-w-lg space-y-10">
        {QUESTIONS.map((q) => {
          const showError = submitted && q.required && values[q.id].trim() === "";

          return (
            <div key={q.id}>
              <label className="block text-sm font-semibold text-[#0F2530]">
                {q.label}
                {q.required ? "*" : ""}
              </label>

              <input
                value={values[q.id]}
                onChange={onChange(q.id)}
                className={[
                  "mt-3 w-full rounded-full bg-[#E5EEF1] px-6 py-4 text-base text-[#0F2530] outline-none",
                  showError ? "ring-1 ring-red-400" : "",
                ].join(" ")}
              />

              {showError ? (
                <p className="mt-3 text-sm font-semibold text-red-400">
                  ERROR: Wait! You left this one blank.
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleNext}
            className="mx-auto flex items-center gap-3 rounded-full bg-[#005271] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95 active:opacity-90"
          >
            Next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
