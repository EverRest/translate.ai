import { Link } from 'react-router-dom';
import { useTerminologyIssues } from '../hooks/useGlossaryConsistency';

type Props = {
  projectId: string;
  variant?: 'badge' | 'link';
};

export function TerminologyDriftBadge({
  projectId,
  variant = 'badge',
}: Props) {
  const { data: issues, isLoading } = useTerminologyIssues(projectId);
  const count = issues?.length ?? 0;

  if (isLoading || count === 0) {
    return null;
  }

  const driftHref = `/projects/${projectId}/glossary?tab=drift`;
  const label =
    count === 1
      ? '1 terminology issue'
      : `${count} terminology issues`;

  if (variant === 'link') {
    return (
      <Link
        to={driftHref}
        className="text-sm text-amber-300 hover:text-amber-200"
      >
        {label} — review in Glossary → Drift
      </Link>
    );
  }

  return (
    <Link
      to={driftHref}
      className="inline-flex items-center rounded-full border border-amber-800/60 bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-200 hover:border-amber-600 hover:text-amber-100"
    >
      {label}
    </Link>
  );
}
