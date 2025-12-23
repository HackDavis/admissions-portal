"use client";

import { UcdParam } from "../_types";

interface FiltersBarProps {
  ucd: UcdParam;
  onUcdChange: (value: UcdParam) => void;
}

export default function FiltersBar({ ucd, onUcdChange }: FiltersBarProps) {
  return (
    <section className="mb-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase">ucd filter</span>
        <select
          value={ucd}
          onChange={(e) => onUcdChange(e.target.value as UcdParam)}
          className="border-2 border-black px-2 py-1 text-xs"
        >
          <option value="all">all</option>
          <option value="true">ucd students</option>
          <option value="false">non-ucd students</option>
        </select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="border-2 border-black px-3 py-1 text-xs font-medium uppercase"
          disabled
          title="wip"
        >
          done
        </button>
      </div>
    </section>
  );
}
