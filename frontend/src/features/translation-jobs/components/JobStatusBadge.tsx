const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300',
  processing: 'bg-sky-500/20 text-sky-300',
  completed: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
  cancelled: 'bg-slate-500/20 text-slate-400',
  retrying: 'bg-violet-500/20 text-violet-300',
};

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusStyles[status] ?? statusStyles.cancelled}`}
    >
      {status}
    </span>
  );
}
