import type { ProjectBranch } from '../types';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-300',
  merged: 'bg-slate-500/20 text-slate-300',
  archived: 'bg-amber-500/20 text-amber-300',
};

type BranchesTableProps = {
  branches: ProjectBranch[];
  selectedId?: string;
  onSelect: (branch: ProjectBranch) => void;
};

export function BranchesTable({
  branches,
  selectedId,
  onSelect,
}: BranchesTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full divide-y divide-slate-800">
        <thead className="bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Branch
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
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
          {branches.map((branch) => (
            <tr
              key={branch.id}
              className={[
                'hover:bg-slate-800/40',
                selectedId === branch.id ? 'bg-sky-950/30' : '',
              ].join(' ')}
            >
              <td className="px-4 py-4 text-sm text-white">
                {branch.name}
                {branch.isDefault && (
                  <span className="ml-2 rounded-md bg-sky-500/20 px-2 py-0.5 text-xs text-sky-300">
                    default
                  </span>
                )}
              </td>
              <td className="px-4 py-4 text-sm">
                <span
                  className={[
                    'rounded-md px-2 py-1 capitalize',
                    statusStyles[branch.status] ?? statusStyles.active,
                  ].join(' ')}
                >
                  {branch.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-slate-400">
                {new Date(branch.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-right text-sm">
                {!branch.isDefault && (
                  <button
                    type="button"
                    onClick={() => onSelect(branch)}
                    className="text-sky-400 hover:text-sky-300"
                  >
                    View diff
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
