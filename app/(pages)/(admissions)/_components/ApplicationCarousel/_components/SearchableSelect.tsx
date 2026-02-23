'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';

interface SearchableSelectProps {
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  pinnedOptions?: string[];
}

export function SearchableSelect({
  placeholder,
  value,
  options,
  onChange,
  disabled,
  pinnedOptions = [],
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // Filter main options (exclude pinned from main list)
  const pinnedSet = useMemo(() => new Set(pinnedOptions), [pinnedOptions]);

  const mainOptions = useMemo(
    () => options.filter((o) => !pinnedSet.has(o)),
    [options, pinnedSet]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mainOptions;
    return mainOptions.filter((o) => o.toLowerCase().includes(q));
  }, [search, mainOptions]);

  // Combined list: filtered main + pinned always at bottom
  const displayList = useMemo(
    () => [...filtered, ...pinnedOptions],
    [filtered, pinnedOptions]
  );

  // Reset highlight only when the search text changes, not on arrow key nav
  useEffect(() => {
    setHighlightIndex(0);
  }, [search]);

  // Position dropdown on open
  useEffect(() => {
    if (!open || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [open]);

  // Focus input on open, clear search on close
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setSearch('');
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !wrapperRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
    },
    [onChange]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightIndex((i) => Math.min(i + 1, displayList.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // Stop the native event from reaching the useEnterKey window listener
      e.nativeEvent.stopImmediatePropagation();
      if (displayList[highlightIndex]) {
        select(displayList[highlightIndex]);
      }
      return;
    }
  };

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
          }}
          className="rounded-2xl bg-white shadow-lg border border-gray-200 overflow-hidden"
        >
          <ul ref={listRef} className="max-h-48 overflow-y-auto" role="listbox">
            {filtered.length === 0 && pinnedOptions.length === 0 && (
              <li className="px-6 py-2 text-sm text-gray-400">
                No results found
              </li>
            )}

            {filtered.map((opt, i) => (
              <li
                key={opt}
                role="option"
                aria-selected={opt === value}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={() => select(opt)}
                className={`cursor-pointer px-6 py-2 text-sm ${
                  i === highlightIndex
                    ? 'bg-[#E5EEF1] text-[#005271] font-semibold'
                    : 'text-[#0F2530]'
                }`}
              >
                {opt}
              </li>
            ))}

            {pinnedOptions.length > 0 && (
              <>
                <li className="border-t border-gray-200" />
                {pinnedOptions.map((opt, j) => {
                  const idx = filtered.length + j;
                  return (
                    <li
                      key={opt}
                      role="option"
                      aria-selected={opt === value}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onClick={() => select(opt)}
                      className={`cursor-pointer px-6 py-2 text-sm ${
                        idx === highlightIndex
                          ? 'bg-[#E5EEF1] text-[#005271] font-semibold'
                          : 'text-[#0F2530]'
                      }`}
                    >
                      {opt}
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div ref={wrapperRef} className="mt-4 relative !text-left">
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value || placeholder || 'Search...'}
            className="w-full rounded-full bg-[#E5EEF1] px-6 py-4 text-sm !text-left outline-none"
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(true)}
            className={`!block w-full rounded-full bg-[#E5EEF1] px-6 py-4 text-sm !text-left outline-none ${
              disabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            {value || (
              <span className="text-gray-400">{placeholder || '\u00A0'}</span>
            )}
          </button>
        )}

        <svg
          className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005271]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {dropdown}
    </>
  );
}
