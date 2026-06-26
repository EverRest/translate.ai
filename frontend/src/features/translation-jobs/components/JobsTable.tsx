import { Link } from 'react-router-dom';
import type { TranslationJob } from '../types';
import { JobStatusBadge } from './JobStatusBadge';

type JobsTableProps = {
  jobs: TranslationJob[];
};

export function JobsTable({ jobs }: JobsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Project
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Items
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Provider
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-900/40">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-slate-800/40">
              <td className="px-4 py-4">
                <p className="font-medium text-white">{job.projectName}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {job.id}
                </p>
              </td>
              <td className="px-4 py-4">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="px-4 py-4 text-sm text-slate-300">
                {job.itemCount}
              </td>
              <td className="px-4 py-4 text-sm capitalize text-slate-400">
                {job.provider ?? 'openai'}
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">
                {new Date(job.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-4 text-right">
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-sm text-sky-400 hover:text-sky-300"
                >
                  Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
