import { useEffect, useRef, useState } from 'react';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import {
  useAddLanguage,
  useProjectLanguages,
  useRemoveLanguage,
} from '../hooks/useProjectSettings';

const LANGUAGES: { code: string; name: string }[] = [
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Estonian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'mt', name: 'Maltese' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'es', name: 'Spanish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'sq', name: 'Albanian' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'is', name: 'Icelandic' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'no', name: 'Norwegian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'ar', name: 'Arabic' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'bn', name: 'Bengali' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'fa', name: 'Persian (Farsi)' },
  { code: 'fil', name: 'Filipino' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'ko', name: 'Korean' },
  { code: 'ms', name: 'Malay' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ne', name: 'Nepali' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sw', name: 'Swahili' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'ur', name: 'Urdu' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
].sort((a, b) => a.name.localeCompare(b.name));

type LanguagesPanelProps = { projectId: string };

export function LanguagesPanel({ projectId }: LanguagesPanelProps) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: languages, isLoading, error } = useProjectLanguages(projectId);
  const add = useAddLanguage(projectId);
  const remove = useRemoveLanguage(projectId);

  const existingCodes = new Set(languages?.map((l) => l.code) ?? []);

  const filtered = LANGUAGES.filter(
    (l) =>
      !existingCodes.has(l.code) &&
      (l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.code.toLowerCase().includes(search.toLowerCase())),
  );

  useEffect(() => {
    if (!open) return;
    setTimeout(() => searchRef.current?.focus(), 50);
    const h = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = (code: string) => {
    setPending((prev) => {
      const n = new Set(prev);
      if (n.has(code)) {
        n.delete(code);
      } else {
        n.add(code);
      }
      return n;
    });
  };

  const handleAdd = async () => {
    for (const code of pending) {
      await new Promise<void>((resolve) => {
        add.mutate(code, { onSettled: () => resolve() });
      });
    }
    setPending(new Set());
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="space-y-4">
      <div ref={dropdownRef} className="relative inline-block">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white hover:border-slate-500 focus:outline-none"
        >
          <svg
            className="h-4 w-4 text-slate-400"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="8" cy="8" r="6.5" />
            <line x1="8" y1="5" x2="8" y2="11" />
            <line x1="5" y1="8" x2="11" y2="8" />
          </svg>
          Add languages
          {pending.size > 0 && (
            <span className="rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] leading-none text-white">
              {pending.size}
            </span>
          )}
          <svg
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M2 4l4 4 4-4" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 flex w-72 flex-col rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            {/* Search */}
            <div className="p-2 border-b border-slate-700">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search languages…"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
              />
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-slate-500">
                  No languages found
                </p>
              )}
              {filtered.map((l) => (
                <label
                  key={l.code}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={pending.has(l.code)}
                    onChange={() => toggle(l.code)}
                    className="h-4 w-4 accent-sky-500"
                  />
                  <span className="flex-1 text-sm text-slate-200">
                    {l.name}
                  </span>
                  <span className="text-xs uppercase text-slate-500">
                    {l.code}
                  </span>
                </label>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-700 p-2 flex gap-2">
              <button
                type="button"
                disabled={pending.size === 0 || add.isPending}
                onClick={() => void handleAdd()}
                className="flex-1 rounded-lg bg-sky-600 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {add.isPending
                  ? 'Adding…'
                  : `Add${pending.size > 0 ? ` ${pending.size}` : ''}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSearch('');
                  setPending(new Set());
                }}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && (
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load.'}
        </p>
      )}
      {!isLoading && (languages?.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">
          No target languages configured.
        </p>
      )}

      <ul className="flex flex-wrap gap-2">
        {languages?.map((language) => {
          const meta = LANGUAGES.find((l) => l.code === language.code);
          return (
            <li
              key={language.id}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200"
            >
              <span className="font-medium">{meta?.name ?? language.code}</span>
              <span className="text-xs text-slate-500 uppercase">
                {language.code}
              </span>
              {!language.isDefault && (
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={async () => {
                    if (
                      await confirm({
                        title: `Remove ${meta?.name ?? language.code}?`,
                        description:
                          'This language and all its translations will be removed from the project.',
                        danger: true,
                        confirmLabel: 'Remove',
                      })
                    )
                      remove.mutate(language.id);
                  }}
                  className="text-slate-500 hover:text-red-400"
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
