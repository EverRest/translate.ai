type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  loading?: boolean;
};

export function StatCard({ label, value, hint, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">
        {loading ? '…' : value}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
