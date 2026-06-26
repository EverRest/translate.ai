type ProjectPlaceholderTabProps = {
  title: string;
  phase: string;
};

export function ProjectPlaceholderTab({
  title,
  phase,
}: ProjectPlaceholderTabProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
      <h2 className="text-lg font-medium text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">
        This section will be implemented in {phase}.
      </p>
    </div>
  );
}
