import type { LocalizationNodeType } from '../types';

const iconClass = 'h-3.5 w-3.5 shrink-0 text-slate-400';

export function NodeTypeIcon({
  type,
}: {
  type: LocalizationNodeType | string;
}) {
  switch (type) {
    case 'section':
    case 'field':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      );
    case 'button':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="8" width="16" height="8" rx="2" />
        </svg>
      );
    case 'placeholder':
    case 'hint':
    case 'tooltip':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7h16M4 12h10M4 17h14" strokeDasharray="3 2" />
        </svg>
      );
    case 'error':
    case 'validation':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      );
    case 'email_subject':
    case 'email_body':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l8 6 8-6M4 6v12h16V6" />
        </svg>
      );
    default:
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 4h12v16H6z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
  }
}
