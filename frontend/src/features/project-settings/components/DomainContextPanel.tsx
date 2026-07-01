import { useEffect, useMemo, useState } from 'react';
import type { DomainProfile, Project } from '../../projects/types';
import { useUpdateProject } from '../../projects/hooks/useProjects';
import {
  useApplyGlossaryPreset,
  useDomainPresets,
} from '../hooks/useDomainContext';
import { buildDomainPromptPreview } from '../utils/domain-prompt-preview';

type DomainContextPanelProps = {
  project: Project;
};

const EMPTY_PROFILE: DomainProfile = {
  domain: '',
  event: '',
  tone: '',
  audience: '',
  notes: '',
  localeNotes: { fr: '', es: '' },
};

function profileFromProject(project: Project): DomainProfile {
  const profile = project.domainProfile;
  if (!profile) {
    return { ...EMPTY_PROFILE };
  }
  return {
    domain: profile.domain ?? '',
    event: profile.event ?? '',
    tone: profile.tone ?? '',
    audience: profile.audience ?? '',
    notes: profile.notes ?? '',
    localeNotes: {
      fr: profile.localeNotes?.fr ?? '',
      es: profile.localeNotes?.es ?? '',
    },
  };
}

function toPayload(profile: DomainProfile): DomainProfile | null {
  const localeNotes: Record<string, string> = {};
  if (profile.localeNotes?.fr?.trim()) {
    localeNotes.fr = profile.localeNotes.fr.trim();
  }
  if (profile.localeNotes?.es?.trim()) {
    localeNotes.es = profile.localeNotes.es.trim();
  }

  const payload: DomainProfile = {};
  if (profile.domain?.trim()) payload.domain = profile.domain.trim();
  if (profile.event?.trim()) payload.event = profile.event.trim();
  if (profile.tone?.trim()) payload.tone = profile.tone.trim();
  if (profile.audience?.trim()) payload.audience = profile.audience.trim();
  if (profile.notes?.trim()) payload.notes = profile.notes.trim();
  if (Object.keys(localeNotes).length > 0) payload.localeNotes = localeNotes;

  return Object.keys(payload).length > 0 ? payload : null;
}

export function DomainContextPanel({ project }: DomainContextPanelProps) {
  const [profile, setProfile] = useState<DomainProfile>(() =>
    profileFromProject(project),
  );
  const [selectedPreset, setSelectedPreset] = useState('');
  const [previewLang, setPreviewLang] = useState('fr');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const presets = useDomainPresets(project.id);
  const update = useUpdateProject();
  const applyGlossary = useApplyGlossaryPreset(project.id);

  useEffect(() => {
    setProfile(profileFromProject(project));
  }, [project]);

  const promptPreview = useMemo(
    () => buildDomainPromptPreview(toPayload(profile), previewLang),
    [profile, previewLang],
  );

  const applyPreset = (presetId: string) => {
    const preset = presets.data?.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    setSelectedPreset(presetId);
    setProfile({
      domain: preset.profile.domain ?? '',
      event: preset.profile.event ?? '',
      tone: preset.profile.tone ?? '',
      audience: preset.profile.audience ?? '',
      notes: preset.profile.notes ?? '',
      localeNotes: {
        fr: preset.profile.localeNotes?.fr ?? '',
        es: preset.profile.localeNotes?.es ?? '',
      },
    });
  };

  const save = () => {
    setSaveMessage(null);
    update.mutate(
      { projectId: project.id, input: { domainProfile: toPayload(profile) } },
      {
        onSuccess: () => setSaveMessage('Domain context saved.'),
        onError: (error) =>
          setSaveMessage(
            error instanceof Error ? error.message : 'Failed to save.',
          ),
      },
    );
  };

  const clear = () => {
    setSelectedPreset('');
    setProfile({ ...EMPTY_PROFILE });
    update.mutate(
      { projectId: project.id, input: { domainProfile: null } },
      { onSuccess: () => setSaveMessage('Domain context cleared.') },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-white">Domain context</h3>
        <p className="mt-1 text-sm text-slate-400">
          Injected into every AI translation prompt for this project — before
          glossary rules. Use presets for FIFA accreditation or venue
          operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Preset</span>
          <select
            value={selectedPreset}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) {
                setSelectedPreset('');
                return;
              }
              applyPreset(value);
            }}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
          >
            <option value="">Custom</option>
            {(presets.data ?? []).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => applyGlossary.mutate('fifa_accreditation')}
            disabled={applyGlossary.isPending}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            {applyGlossary.isPending
              ? 'Applying glossary…'
              : 'Apply FIFA glossary preset'}
          </button>
        </div>
      </div>

      {applyGlossary.isSuccess && (
        <p className="text-sm text-emerald-400">
          Added {applyGlossary.data.added} glossary term
          {applyGlossary.data.added === 1 ? '' : 's'}
          {applyGlossary.data.skipped > 0
            ? ` (${applyGlossary.data.skipped} already present)`
            : ''}
          .
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Domain</span>
          <input
            value={profile.domain ?? ''}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                domain: event.target.value,
              }))
            }
            placeholder="sports"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Event</span>
          <input
            value={profile.event ?? ''}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                event: event.target.value,
              }))
            }
            placeholder="FIFA World Cup 2026"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Tone</span>
          <input
            value={profile.tone ?? ''}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                tone: event.target.value,
              }))
            }
            placeholder="formal"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Audience</span>
          <input
            value={profile.audience ?? ''}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                audience: event.target.value,
              }))
            }
            placeholder="accreditation"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="text-slate-400">Additional notes</span>
        <textarea
          value={profile.notes ?? ''}
          onChange={(event) =>
            setProfile((current) => ({ ...current, notes: event.target.value }))
          }
          rows={3}
          placeholder="Free-text context for the AI translator…"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">French locale note</span>
          <textarea
            value={profile.localeNotes?.fr ?? ''}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                localeNotes: {
                  ...current.localeNotes,
                  fr: event.target.value,
                },
              }))
            }
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Spanish locale note</span>
          <textarea
            value={profile.localeNotes?.es ?? ''}
            onChange={(event) =>
              setProfile((current) => ({
                ...current,
                localeNotes: {
                  ...current.localeNotes,
                  es: event.target.value,
                },
              }))
            }
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
          />
        </label>
      </div>

      {promptPreview && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Prompt preview (system excerpt)
            </span>
            <select
              value={previewLang}
              onChange={(event) => setPreviewLang(event.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"
            >
              <option value="fr">fr</option>
              <option value="es">es</option>
              <option value="de">de</option>
            </select>
          </div>
          <pre className="whitespace-pre-wrap text-xs text-slate-300 font-mono">
            {promptPreview}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={update.isPending}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {update.isPending ? 'Saving…' : 'Save domain context'}
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={update.isPending}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          Clear
        </button>
        {saveMessage && (
          <span
            className={
              saveMessage.includes('Failed')
                ? 'text-sm text-red-400'
                : 'text-sm text-emerald-400'
            }
          >
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}
