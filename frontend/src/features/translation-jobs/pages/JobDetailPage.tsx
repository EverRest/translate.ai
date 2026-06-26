import { Link, useParams } from 'react-router-dom';
import { useProject } from '../../projects/hooks/useProjects';
import { JobStatusBadge } from '../components/JobStatusBadge';
import { useCancelJob, useJob, useRetryJob } from '../hooks/useTranslationJobs';

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { data: job, isLoading, error } = useJob(jobId);
  const { data: project } = useProject(job?.projectId);
  const retry = useRetryJob(jobId ?? '');
  const cancel = useCancelJob(jobId ?? '');

  if (isLoading) {
    return <p className="text-slate-400">Loading job…</p>;
  }

  if (error || !job) {
    return (
      <p className="text-red-400">
        {error instanceof Error ? error.message : 'Job not found.'}
      </p>
    );
  }

  const progressPercent =
    job.progress.total > 0
      ? Math.round((job.progress.completed / job.progress.total) * 100)
      : 0;

  const pendingCount = Math.max(
    0,
    job.progress.total - job.progress.completed - job.progress.failed,
  );

  const isOllama = job.provider === 'ollama';

  const canRetry =
    job.status === 'failed' ||
    job.status === 'completed' ||
    job.progress.failed > 0;
  const canCancel = job.status === 'pending' || job.status === 'processing';

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/jobs" className="hover:text-slate-300">
            Jobs
          </Link>{' '}
          / {job.id.slice(0, 8)}…
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">Job details</h1>
          <JobStatusBadge status={job.status} />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Project:{' '}
          <Link
            to={`/projects/${job.projectId}`}
            className="text-sky-400 hover:text-sky-300"
          >
            {project?.name ?? job.projectId}
          </Link>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-sm font-medium text-slate-300">Progress</h2>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-slate-400">
              <span>{progressPercent}% complete</span>
              <span>
                {job.progress.completed}/{job.progress.total} items
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{job.progress.completed} completed</span>
              {pendingCount > 0 && <span>{pendingCount} pending</span>}
              {job.progress.failed > 0 && (
                <span className="text-red-400">{job.progress.failed} failed</span>
              )}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-sky-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {job.progress.failed > 0 && (
              <p className="mt-2 text-sm text-red-400">
                {job.progress.failed} item(s) failed
                {isOllama && ' — Ollama may have timed out; increase OLLAMA_TIMEOUT_MS or use Retry'}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-sm font-medium text-slate-300">Details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Provider</dt>
              <dd className="mt-1 capitalize text-white">
                {job.provider ?? 'openai'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Created</dt>
              <dd className="mt-1 text-white">
                {new Date(job.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Job ID</dt>
              <dd className="mt-1 font-mono text-xs text-slate-300">
                {job.id}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {canRetry && (
          <button
            type="button"
            disabled={retry.isPending}
            onClick={() => retry.mutate()}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-50"
          >
            {retry.isPending ? 'Retrying…' : 'Retry failed items'}
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() => {
              if (window.confirm('Cancel this job?')) {
                cancel.mutate();
              }
            }}
            className="rounded-lg border border-red-900/50 px-4 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50"
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel job'}
          </button>
        )}
      </div>

      {(retry.error || cancel.error) && (
        <p className="text-sm text-red-400">
          {(retry.error ?? cancel.error) instanceof Error
            ? (retry.error ?? cancel.error)?.message
            : 'Action failed'}
        </p>
      )}

      {(job.status === 'pending' || job.status === 'processing') && (
        <p className="text-xs text-slate-500">
          Progress refreshes automatically every few seconds. Ensure the backend
          worker is running (`npm run start:worker`).
        </p>
      )}
    </section>
  );
}
