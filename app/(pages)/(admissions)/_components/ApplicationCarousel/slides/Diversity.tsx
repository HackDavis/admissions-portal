'use client';

import React from 'react';

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

type SectionKey = 'gender' | 'race' | 'attended';

type FormState = {
  gender: string[];
  race: string[];
  attended: string[];
};

export default function Diversity() {
  const [state, setState] = React.useState<FormState>({
    gender: [],
    race: [],
    attended: [],
  });

  const toggleOption = (section: SectionKey, value: string) => {
    setState((prev) => {
      const exists = prev[section].includes(value);
      return {
        ...prev,
        [section]: exists
          ? prev[section].filter((v) => v !== value)
          : [...prev[section], value],
      };
    });
  };

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[520px] text-center">
        <h1 className="font-metropolis text-[48px] font-bold leading-[1] tracking-[0.01em] text-[#005271]">
          Diversity matters
          <br />
          to us!
        </h1>

        <p className="mx-auto mt-4 max-w-[420px] text-sm leading-snug text-[#0F2530]">
          We never use this information to review applications.
          <br />
          Feel free to skip any question. Responses are only
          <br />
          collected to improve inclusivity at HackDavis.
        </p>

        <div className="mt-12 text-left space-y-12">
          <Question
            title="What’s your gender?"
            section="gender"
            state={state}
            onToggle={toggleOption}
          />

          <Question
            title="Which race/ethnicity do you identify with?"
            section="race"
            state={state}
            onToggle={toggleOption}
          />

          <Question
            title="Have you attended HackDavis before?*"
            section="attended"
            state={state}
            onToggle={toggleOption}
          />
        </div>

        <div className="mt-14 flex justify-center">
          <button
            type="button"
            className="flex items-center gap-3 rounded-full bg-[#9FB6BE] px-10 py-4 text-base font-semibold text-white transition hover:opacity-95"
          >
            Next <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function Question({
  title,
  section,
  state,
  onToggle,
}: {
  title: string;
  section: SectionKey;
  state: FormState;
  onToggle: (section: SectionKey, value: string) => void;
}) {
  return (
    <div>
      <p className="mb-5 text-base font-semibold text-[#0F2530]">{title}</p>

      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <OptionRow
            key={i}
            label={LOREM}
            checked={state[section].includes(`${LOREM}-${i}`)}
            onChange={() => onToggle(section, `${LOREM}-${i}`)}
          />
        ))}
      </div>
    </div>
  );
}

function OptionRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-4 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 rounded border-[#A6BFC7] accent-[#173B47]"
      />
      <span className="text-sm text-[#0F2530]">{label}</span>
    </label>
  );
}
