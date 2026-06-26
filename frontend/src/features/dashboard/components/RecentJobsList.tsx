import { Link } from 'react-router-dom';
import type { JobSummary } from '../api/dashboard.api';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  processing: 'bg-sky-500/20 text-sky-300',
  completed: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
  cancelled: 'bg-slate-500/20 text-slate-400',
};

type RecentJobsListProps = {
  jobs: JobSummary[];
  loading?: boolean;
};

export function RecentJobsList({ jobs, loading }: RecentJobsListProps) {
  if (loading) {
    return <p className="text-sm text-slate-400">Loading jobs…</p>;
  }

  if (jobs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        No translation jobs yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-800">
      {jobs.map((job) => (
        <li key={job.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-white">{job.projectName}</p>
            <p className="text-xs text-slate-500">
              {job.itemCount} items · {job.provider ?? 'default provider'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[job.status] ?? statusStyles.cancelled}`}
            >
              {job.status}
            </span>
            <Link
              to={`/jobs/${job.id}`}
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              View
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
