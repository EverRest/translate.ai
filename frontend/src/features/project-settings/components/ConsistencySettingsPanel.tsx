import { useUpdateProject } from '../../projects/hooks/useProjects';
import type { Project } from '../../projects/types';

type Props = {
  project: Project;
};

export function ConsistencySettingsPanel({ project }: Props) {
  const update = useUpdateProject();
  const enabled = project.autoTerminologyScan ?? true;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-white">
          Terminology consistency
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          After each translation job completes, scan for inconsistent terms
          across keys and surface them in Glossary → Terminology drift.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
        <input
          type="checkbox"
          checked={enabled}
          disabled={update.isPending}
          onChange={(event) => {
            update.mutate({
              projectId: project.id,
              input: { autoTerminologyScan: event.target.checked },
            });
          }}
          className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500"
        />
        <span>
          <span className="block text-sm font-medium text-white">
            Auto-scan after translation jobs
          </span>
          <span className="mt-1 block text-sm text-slate-400">
            Recommended for FIFA demos — keeps Submit/Customer terminology
            consistent without manual scans.
          </span>
        </span>
      </label>

      {update.error instanceof Error && (
        <p className="text-sm text-red-400">{update.error.message}</p>
      )}
    </div>
  );
}
