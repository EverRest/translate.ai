import { useState } from 'react';
import { CreateJobModal } from '../components/CreateJobModal';
import { JobsTable } from '../components/JobsTable';
import { useCreateJob, useJobsList } from '../hooks/useTranslationJobs';

type JobsListSectionProps = {
  projectId?: string;
  title?: string;
  description?: string;
};

export function JobsListSection({
  projectId,
  title = 'Translation jobs',
  description = 'Monitor AI translation jobs across your workspace.',
}: JobsListSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, error } = useJobsList(1, 20, projectId);
  const create = useCreateJob();

  const jobs = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {projectId
              ? `${total} job${total === 1 ? '' : 's'} for this project`
              : description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
        >
          New job
        </button>
      </div>

      {isLoading && <p className="text-slate-400">Loading jobs…</p>}
      {error && (
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load jobs.'}
        </p>
      )}

      {!isLoading && !error && jobs.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
          <p className="text-slate-400">No translation jobs yet.</p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-4 text-sm text-sky-400 hover:text-sky-300"
          >
            Create your first job
          </button>
        </div>
      )}

      {jobs.length > 0 && <JobsTable jobs={jobs} />}

      <CreateJobModal
        open={createOpen}
        defaultProjectId={projectId}
        loading={create.isPending}
        error={create.error instanceof Error ? create.error.message : undefined}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => {
          create.mutate(values, { onSuccess: () => setCreateOpen(false) });
        }}
      />
    </section>
  );
}

export function JobsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Translation jobs</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create and monitor AI translation jobs.
        </p>
      </div>
      <JobsListSection />
    </section>
  );
}
