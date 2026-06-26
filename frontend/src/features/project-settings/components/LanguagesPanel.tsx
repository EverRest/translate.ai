import { useState } from 'react';
import {
  useAddLanguage,
  useProjectLanguages,
  useRemoveLanguage,
} from '../hooks/useProjectSettings';

type LanguagesPanelProps = {
  projectId: string;
};

export function LanguagesPanel({ projectId }: LanguagesPanelProps) {
  const [code, setCode] = useState('');
  const { data: languages, isLoading, error } = useProjectLanguages(projectId);
  const add = useAddLanguage(projectId);
  const remove = useRemoveLanguage(projectId);

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!code.trim()) {
            return;
          }
          add.mutate(code.trim().toLowerCase(), {
            onSuccess: () => setCode(''),
          });
        }}
      >
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Language code (e.g. de)"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm uppercase text-white outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Add language
        </button>
      </form>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && (
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load languages.'}
        </p>
      )}

      {!isLoading && (languages?.length ?? 0) === 0 && (
        <p className="text-sm text-slate-500">
          No target languages configured.
        </p>
      )}

      <ul className="flex flex-wrap gap-2">
        {languages?.map((language) => (
          <li
            key={language.id}
            className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-sm uppercase text-slate-200"
          >
            {language.code}
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Remove language ${language.code}?`)) {
                  remove.mutate(language.id);
                }
              }}
              className="text-slate-500 hover:text-red-400"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
