import { useMemo, useState } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { useToast } from '../../../shared/ui/use-toast';
import type { ProjectSettingsCopyInclude } from '../api/projects.api';
import { useCopyProjectSettings } from '../hooks/useCopyProjectSettings';
import { useProjectsList, useUpdateProject } from '../hooks/useProjects';
import type { DomainPreset, Project } from '../types';
import {
  useApplyGlossaryPreset,
  useDomainPresets,
} from '../../project-settings/hooks/useDomainContext';

type OnboardingPath = 'fifa' | 'copy';

type ProjectOnboardingModalProps = {
  open: boolean;
  project: Project;
  onDone: () => void;
};

export function ProjectOnboardingModal({
  open,
  project,
  onDone,
}: ProjectOnboardingModalProps) {
  const toast = useToast();
  const [path, setPath] = useState<OnboardingPath>('fifa');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [applyGlossary, setApplyGlossary] = useState(true);
  const [copyGlossary, setCopyGlossary] = useState(true);
  const [sourceProjectId, setSourceProjectId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const presets = useDomainPresets(project.id);
  const projectsList = useProjectsList(1, 100);
  const update = useUpdateProject();
  const applyGlossaryPreset = useApplyGlossaryPreset(project.id);
  const copyProjectSettings = useCopyProjectSettings(project.id);

  const fifaPresets = useMemo(
    () =>
      (presets.data ?? []).filter((preset) =>
        ['fifa_accreditation', 'fifa_venue_ops'].includes(preset.id),
      ),
    [presets.data],
  );

  const copySources = useMemo(
    () =>
      (projectsList.data?.items ?? []).filter(
        (item) => item.id !== project.id && item.status === 'active',
      ),
    [projectsList.data?.items, project.id],
  );

  const selectedPreset = fifaPresets.find(
    (preset) => preset.id === selectedPresetId,
  );

  const applyFifaPreset = async (preset: DomainPreset) => {
    await update.mutateAsync({
      projectId: project.id,
      input: { domainProfile: preset.profile },
    });

    if (applyGlossary && preset.glossaryPresetId) {
      await applyGlossaryPreset.mutateAsync(preset.glossaryPresetId);
    }
  };

  const applyCopyFromProject = async () => {
    if (!sourceProjectId) {
      setError('Select a project to copy from.');
      return;
    }

    const source = copySources.find((item) => item.id === sourceProjectId);
    if (!source) {
      setError('Select a project to copy from.');
      return;
    }

    const include: ProjectSettingsCopyInclude[] = [];
    if (source.domainProfile) {
      include.push('domainProfile');
    }
    if (copyGlossary) {
      include.push('glossary');
    }

    if (include.length === 0) {
      setError(
        'That project has no domain context to copy. Enable glossary copy or pick another project.',
      );
      return;
    }

    return copyProjectSettings.mutateAsync({
      sourceProjectId,
      include,
    });
  };

  const formatCopyResult = (result: {
    domainProfileCopied: boolean;
    glossaryAdded: number;
    glossarySkipped: number;
  }) => {
    const parts: string[] = [];
    if (result.domainProfileCopied) {
      parts.push('Domain context copied');
    }
    if (result.glossaryAdded > 0 || result.glossarySkipped > 0) {
      parts.push(
        `Added ${result.glossaryAdded} glossary term${result.glossaryAdded === 1 ? '' : 's'}${
          result.glossarySkipped > 0
            ? ` (${result.glossarySkipped} already present)`
            : ''
        }`,
      );
    }
    return parts.length > 0 ? parts.join('. ') + '.' : 'Settings copied.';
  };

  const handleApply = async () => {
    setError(null);
    setBusy(true);
    try {
      if (path === 'fifa') {
        if (!selectedPreset) {
          setError('Select a FIFA preset.');
          return;
        }
        await applyFifaPreset(selectedPreset);
        toast.success('Domain context applied.');
      } else {
        const result = await applyCopyFromProject();
        if (!result) {
          return;
        }
        toast.success(formatCopyResult(result));
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply setup.');
    } finally {
      setBusy(false);
    }
  };

  const applyDisabled =
    busy ||
    (path === 'fifa' && !selectedPresetId) ||
    (path === 'copy' && !sourceProjectId);

  return (
    <Modal title="Set up your project" open={open} onClose={onDone} size="lg">
      <div className="space-y-5">
        <p className="text-sm text-slate-400">
          Optional — add domain context so AI translations match your sport or
          event. You can change this anytime in project settings.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setPath('fifa');
              setError(null);
            }}
            className={[
              'rounded-lg border px-4 py-3 text-left transition-colors',
              path === 'fifa'
                ? 'border-sky-600 bg-sky-600/10'
                : 'border-slate-700 hover:border-slate-600',
            ].join(' ')}
          >
            <span className="block text-sm font-medium text-white">
              Use FIFA preset
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Accreditation or venue operations
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPath('copy');
              setError(null);
            }}
            className={[
              'rounded-lg border px-4 py-3 text-left transition-colors',
              path === 'copy'
                ? 'border-sky-600 bg-sky-600/10'
                : 'border-slate-700 hover:border-slate-600',
            ].join(' ')}
          >
            <span className="block text-sm font-medium text-white">
              Copy from another project
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Reuse domain context from your tenant
            </span>
          </button>
        </div>

        {path === 'fifa' && (
          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <label className="block text-sm">
              <span className="text-slate-400">FIFA preset</span>
              <select
                value={selectedPresetId}
                onChange={(event) => setSelectedPresetId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              >
                <option value="">Select preset…</option>
                {fifaPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedPreset?.description && (
              <p className="text-xs text-slate-500">
                {selectedPreset.description}
              </p>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={applyGlossary}
                onChange={(event) => setApplyGlossary(event.target.checked)}
                className="rounded border-slate-600 bg-slate-950"
              />
              Apply FIFA glossary
            </label>
          </div>
        )}

        {path === 'copy' && (
          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <label className="block text-sm">
              <span className="text-slate-400">Source project</span>
              <select
                value={sourceProjectId}
                onChange={(event) => setSourceProjectId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              >
                <option value="">Select project…</option>
                {copySources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.domainProfile ? '' : ' (no domain context)'}
                  </option>
                ))}
              </select>
            </label>
            {copySources.length === 0 && (
              <p className="text-xs text-slate-500">
                No other active projects in this tenant yet.
              </p>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={copyGlossary}
                onChange={(event) => setCopyGlossary(event.target.checked)}
                className="rounded border-slate-600 bg-slate-950"
              />
              Copy glossary terms
            </label>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onDone}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={applyDisabled}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {busy ? 'Applying…' : 'Apply and continue'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
