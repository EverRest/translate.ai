function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function formatObjectProgress(
  materializedCount: number,
  nodeCount: number,
): { label: string; percent: number } {
  if (nodeCount <= 0) {
    return { label: '0 materialized', percent: 0 };
  }
  const percent = Math.round((materializedCount / nodeCount) * 100);
  return {
    label: `${materializedCount}/${nodeCount} materialized`,
    percent,
  };
}

export { formatRelativeTime };
