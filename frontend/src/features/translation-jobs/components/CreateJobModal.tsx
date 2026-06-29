import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../../../shared/ui/Modal';
import { useProjectsList } from '../../projects/hooks/useProjects';
import { useTranslationKeys } from '../../translation-keys/hooks/useTranslationKeys';
import { useProjectLanguages } from '../hooks/useTranslationJobs';
import { parseInlineKeyItems } from '../utils/parseInlineKeyItems';
import type { CreateJobInput } from '../types';

const PROVIDERS = ['openai', 'gemini', 'ollama'] as const;

type KeySource = 'catalog' | 'inline';

type CreateJobModalProps = {
  open: boolean;
  defaultProjectId?: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CreateJobInput) => void;
};

export function CreateJobModal({
  open,
  defaultProjectId,
  loading,
  error,
  onClose,
  onSubmit,
}: CreateJobModalProps) {
  const { data: projectsData } = useProjectsList(1, 100);
  const projects = useMemo(
    () => projectsData?.items ?? [],
    [projectsData?.items],
  );

  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [customLanguages, setCustomLanguages] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [keySource, setKeySource] = useState<KeySource>('catalog');
  const [inlineKeys, setInlineKeys] = useState('');
  const [provider, setProvider] = useState<string>('gemini');
  const [formError, setFormError] = useState<string>();

  const { data: languagesData } = useProjectLanguages(projectId || undefined);
  const { data: keysData } = useTranslationKeys(projectId || undefined, 1, 200);

  const configuredLanguages = languagesData ?? [];
  const translationKeys = keysData?.items ?? [];

  useEffect(() => {
    if (open) {
      setProjectId(defaultProjectId ?? projects[0]?.id ?? '');
      setSelectedLanguages([]);
      setCustomLanguages('');
      setSelectedKeys([]);
      setKeySource('catalog');
      setInlineKeys('');
      setProvider('gemini');
      setFormError(undefined);
    }
  }, [open, defaultProjectId, projects]);

  useEffect(() => {
    if (open && defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [open, defaultProjectId]);

  useEffect(() => {
    if (open && translationKeys.length === 0) {
      setKeySource('inline');
    }
  }, [open, translationKeys.length]);

  const customLanguageList = useMemo(
    () =>
      customLanguages
        .split(',')
        .map((code) => code.trim().toLowerCase())
        .filter(Boolean),
    [customLanguages],
  );

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
  };

  const toggleKey = (key: string) => {
    setSelectedKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  const selectAllKeys = () => {
    setSelectedKeys(translationKeys.map((item) => item.key));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);

    if (!projectId) {
      setFormError('Select a project.');
      return;
    }

    const languages = [
      ...new Set([...selectedLanguages, ...customLanguageList]),
    ];
    if (languages.length === 0) {
      setFormError('Select at least one target language.');
      return;
    }

    if (keySource === 'catalog') {
      if (selectedKeys.length === 0) {
        setFormError('Select at least one translation key.');
        return;
      }
      onSubmit({
        projectId,
        languages,
        keys: selectedKeys,
        provider: provider || undefined,
      });
      return;
    }

    try {
      const keyItems = parseInlineKeyItems(inlineKeys);
      if (keyItems.length === 0) {
        setFormError('Add at least one inline key (key | source text).');
        return;
      }
      onSubmit({
        projectId,
        languages,
        keyItems,
        provider: provider || undefined,
      });
    } catch (parseError) {
      setFormError(
        parseError instanceof Error
          ? parseError.message
          : 'Could not parse inline keys.',
      );
    }
  };

  return (
    <Modal title="Create translation job" open={open} onClose={onClose}>
      <form
        className="max-h-[70vh] space-y-5 overflow-y-auto pr-1"
        onSubmit={handleSubmit}
      >
        {!defaultProjectId && (
          <div>
            <label className="block text-sm text-slate-300" htmlFor="project">
              Project
            </label>
            <select
              id="project"
              value={projectId}
              onChange={(event) => {
                setProjectId(event.target.value);
                setSelectedLanguages([]);
                setSelectedKeys([]);
              }}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
            >
              <option value="">Select project…</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300">
            Target languages
          </label>
          {configuredLanguages.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {configuredLanguages.map((language) => (
                <label
                  key={language.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(language.code)}
                    onChange={() => toggleLanguage(language.code)}
                  />
                  <span className="uppercase text-slate-200">
                    {language.code}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              No languages configured yet — enter codes below (they are added
              automatically).
            </p>
          )}
          <input
            type="text"
            value={customLanguages}
            onChange={(event) => setCustomLanguages(event.target.value)}
            placeholder="Enter codes: de, fr, es"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-sm text-slate-300">
              Translation keys
            </label>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setKeySource('catalog')}
                className={[
                  'rounded px-2 py-1',
                  keySource === 'catalog'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                From project
              </button>
              <button
                type="button"
                onClick={() => setKeySource('inline')}
                className={[
                  'rounded px-2 py-1',
                  keySource === 'inline'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                Inline (API-style)
              </button>
            </div>
          </div>

          {keySource === 'catalog' ? (
            <>
              {!projectId && (
                <p className="mt-2 text-xs text-slate-500">
                  Select a project first.
                </p>
              )}
              {projectId && translationKeys.length === 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  No keys in this project. Add them on the{' '}
                  <Link
                    to={`/projects/${projectId}/keys`}
                    className="text-sky-400 hover:text-sky-300"
                    onClick={onClose}
                  >
                    Keys tab
                  </Link>{' '}
                  or switch to Inline (API-style).
                </p>
              )}
              {translationKeys.length > 0 && (
                <>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={selectAllKeys}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Select all
                    </button>
                  </div>
                  <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-800 p-3">
                    {translationKeys.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedKeys.includes(item.key)}
                          onChange={() => toggleKey(item.key)}
                        />
                        <span>
                          <span className="font-mono text-sky-300">
                            {item.key}
                          </span>
                          <span className="mt-0.5 block text-slate-400">
                            {item.sourceText}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-slate-500">
                One key per line:{' '}
                <span className="font-mono">key | source text</span>. Keys and
                languages are created on the project automatically.
              </p>
              <textarea
                value={inlineKeys}
                onChange={(event) => setInlineKeys(event.target.value)}
                rows={6}
                placeholder={
                  'greeting.hello | Hello world\ncart.checkout | Checkout'
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-sky-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-300" htmlFor="provider">
            AI provider
          </label>
          <select
            id="provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
          >
            {PROVIDERS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {(formError || error) && (
          <p className="text-sm text-red-400">{formError ?? error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Start job'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
