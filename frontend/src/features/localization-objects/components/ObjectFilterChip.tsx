type ObjectFilterChipProps = {
  objectName?: string;
  onClear: () => void;
};

export function ObjectFilterChip({
  objectName,
  onClear,
}: ObjectFilterChipProps) {
  if (!objectName) {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-sky-800/50 bg-sky-950/30 px-3 py-1 text-sm text-sky-200">
      <span>Object: {objectName}</span>
      <button
        type="button"
        onClick={onClear}
        className="text-sky-400 hover:text-white"
        aria-label="Clear object filter"
      >
        ×
      </button>
    </div>
  );
}
