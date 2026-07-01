import { useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { useUpdateProject } from '../hooks/useProjects';
import { useTranslations } from '../../translations/hooks/useTranslations';
import { useTranslationKeys } from '../../translation-keys/hooks/useTranslationKeys';
import { useJobsList } from '../../translation-jobs/hooks/useTranslationJobs';
import { useProjectReviews } from '../../approvals/hooks/useApprovals';
import type { Project } from '../types';
import type { Translation } from '../../translations/types';

// ─── helpers ──────────────────────────────────────────────────────────────────
function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100);
}

function colorMeta(p: number) {
  if (p === 100)
    return {
      bar: 'bg-emerald-500',
      text: 'text-emerald-400',
      stroke: '#10b981',
      glow: 'rgba(16,185,129,0.3)',
    };
  if (p >= 70)
    return {
      bar: 'bg-sky-500',
      text: 'text-sky-400',
      stroke: '#0ea5e9',
      glow: 'rgba(14,165,233,0.3)',
    };
  if (p >= 30)
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-400',
      stroke: '#f59e0b',
      glow: 'rgba(245,158,11,0.3)',
    };
  return {
    bar: 'bg-red-500',
    text: 'text-red-400',
    stroke: '#ef4444',
    glow: 'rgba(239,68,68,0.3)',
  };
}

// ─── Donut ────────────────────────────────────────────────────────────────────
function Donut({ value, size = 128 }: { value: number; size?: number }) {
  const { stroke, glow } = colorMeta(value);
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const cx = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#1e293b"
        strokeWidth={12}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)' }}
      />
      <text
        x={cx}
        y={cx - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={size * 0.2}
        fontWeight="700"
        fontFamily="ui-monospace,monospace"
      >
        {value}%
      </text>
      <text
        x={cx}
        y={cx + 14}
        textAnchor="middle"
        fill="#64748b"
        fontSize={size * 0.1}
        fontFamily="ui-sans-serif,system-ui,sans-serif"
      >
        overall
      </text>
    </svg>
  );
}

// ─── LangBar ─────────────────────────────────────────────────────────────────
function LangBar({
  code,
  count,
  total,
}: {
  code: string;
  count: number;
  total: number;
}) {
  const p = pct(count, total);
  const { bar, text } = colorMeta(p);
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {code}
      </span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${p}%` }}
        />
      </div>
      <span
        className={`w-9 shrink-0 text-right text-xs font-bold tabular-nums ${text}`}
      >
        {p}%
      </span>
      <span className="w-16 shrink-0 text-right text-[11px] text-slate-600 tabular-nums">
        {count} / {total}
      </span>
    </div>
  );
}

// ─── StatBox ─────────────────────────────────────────────────────────────────
function StatBox({
  label,
  value,
  color = 'text-white',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-700/40',
  archived: 'bg-slate-700/30 text-slate-400 border border-slate-700/40',
};

const JOB_STATUS_COLOR: Record<string, string> = {
  pending: 'text-amber-400',
  processing: 'text-sky-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  cancelled: 'text-slate-500',
};

// ─── ProjectOverviewTab ───────────────────────────────────────────────────────
export function ProjectOverviewTab() {
  const { project } = useOutletContext<{ project: Project }>();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const update = useUpdateProject();

  const { data: translationsData } = useTranslations(projectId);
  const { data: keysData } = useTranslationKeys(projectId, 1, 1);
  const { data: jobsData } = useJobsList(1, 100, projectId);
  const { data: pendingReviews } = useProjectReviews(projectId, 'pending');
  const { data: approvedReviews } = useProjectReviews(projectId, 'approved');

  const totalKeys = keysData?.meta.total ?? project.keysCount ?? 0;
  const targetLangs = project.languages.filter((l) => !l.isDefault);
  const defaultLang = project.languages.find((l) => l.isDefault);

  // translation coverage
  const byKey = new Map<string, Record<string, Translation>>();
  for (const t of translationsData?.items ?? []) {
    if (!byKey.has(t.key)) byKey.set(t.key, {});
    byKey.get(t.key)![t.language] = t;
  }
  const langStats = targetLangs
    .map((lang) => {
      let count = 0;
      byKey.forEach((m) => {
        if (m[lang.code]) count++;
      });
      return { code: lang.code, count };
    })
    .sort((a, b) => pct(b.count, totalKeys) - pct(a.count, totalKeys));
  const totalTranslated = langStats.reduce((s, l) => s + l.count, 0);
  const totalPossible = totalKeys * targetLangs.length;
  const overallPct = pct(totalTranslated, totalPossible);

  // jobs breakdown
  const jobs = jobsData?.items ?? [];
  const jobsByStatus: Record<string, number> = {};
  for (const j of jobs) {
    jobsByStatus[j.status] = (jobsByStatus[j.status] ?? 0) + 1;
  }

  // reviews breakdown — group by status from items
  const allReviews = [
    ...(pendingReviews?.items ?? []),
    ...(approvedReviews?.items ?? []),
  ];
  const reviewsByStatus: Record<string, number> = {};
  for (const r of allReviews) {
    reviewsByStatus[r.status] = (reviewsByStatus[r.status] ?? 0) + 1;
  }
  const pendingCount = pendingReviews?.meta.total ?? 0;
  const approvedCount = approvedReviews?.meta.total ?? 0;
  const rejectedCount = reviewsByStatus['rejected'] ?? 0;
  const draftCount = reviewsByStatus['draft'] ?? 0;
  const retranslateCount = reviewsByStatus['retranslated'] ?? 0;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {!project.domainProfile && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-3 shrink-0">
          <p className="text-sm text-amber-200/90">
            Add domain context for better translations — sport, event, tone, and
            locale notes for AI prompts.
          </p>
          <button
            type="button"
            onClick={() =>
              navigate(`/projects/${projectId}/settings?tab=domain`)
            }
            className="shrink-0 rounded-lg border border-amber-700/60 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-900/40"
          >
            Set up domain context
          </button>
        </div>
      )}

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4 shrink-0">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Name + status + edit */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white leading-none">
                {project.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] capitalize font-medium ${STATUS_BADGE[project.status] ?? STATUS_BADGE.archived}`}
              >
                {project.status}
              </span>
              <span className="font-mono text-[11px] text-slate-600 select-all">
                {project.id}
              </span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="shrink-0 rounded-lg border border-slate-700 px-3 py-0.5 text-xs text-slate-400 hover:border-slate-500 hover:text-white transition-colors"
              >
                Edit
              </button>
            </div>
            {project.description && (
              <p className="mt-1.5 text-xs text-slate-400 max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500">Languages</span>
            {defaultLang && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-300">
                {defaultLang.code}
                <span className="text-[9px] text-slate-500 normal-case">
                  default
                </span>
              </span>
            )}
            {targetLangs.map((l) => (
              <span
                key={l.code}
                className="inline-flex items-center rounded-full border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-400"
              >
                {l.code}
              </span>
            ))}
            {targetLangs.length === 0 && !defaultLang && (
              <span className="text-[11px] text-slate-600">—</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Keys</span>
            <span className="text-[11px] text-slate-300 tabular-nums">
              {totalKeys}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Jobs</span>
            <span className="text-[11px] text-slate-300 tabular-nums">
              {jobs.length}
            </span>
            {(jobsByStatus['pending'] ?? 0) +
              (jobsByStatus['processing'] ?? 0) >
              0 && (
              <span className="text-[11px] text-amber-400">
                (
                {(jobsByStatus['pending'] ?? 0) +
                  (jobsByStatus['processing'] ?? 0)}{' '}
                active)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Created</span>
            <span className="text-[11px] text-slate-300">
              {new Date(project.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Translation coverage ──────────────────────────────────────────── */}
      {targetLangs.length > 0 && totalKeys > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shrink-0">
          <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Translation coverage
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <Donut value={overallPct} size={140} />
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-500">Translated</p>
                  <p className="mt-0.5 text-base font-bold text-white tabular-nums">
                    {totalTranslated}
                  </p>
                </div>
                <div className="w-px bg-slate-800" />
                <div>
                  <p className="text-xs text-slate-500">Missing</p>
                  <p className="mt-0.5 text-base font-bold text-slate-500 tabular-nums">
                    {totalPossible - totalTranslated}
                  </p>
                </div>
                <div className="w-px bg-slate-800" />
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="mt-0.5 text-base font-bold text-slate-500 tabular-nums">
                    {totalPossible}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden w-px bg-slate-800 self-stretch sm:block" />
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">
                Per language
              </p>
              {langStats.map((l) => (
                <LangBar
                  key={l.code}
                  code={l.code}
                  count={l.count}
                  total={totalKeys}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Jobs + Approvals ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 shrink-0">
        {/* Jobs card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-slate-400"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 1v6l3 3M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14z" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-200">Jobs</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}/jobs`)}
              className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
            >
              View all →
            </button>
          </div>
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-600">No jobs yet</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {[
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled',
              ].map((s) =>
                (jobsByStatus[s] ?? 0) > 0 ? (
                  <StatBox
                    key={s}
                    label={s}
                    value={jobsByStatus[s]}
                    color={JOB_STATUS_COLOR[s]}
                  />
                ) : null,
              )}
            </div>
          )}
        </div>

        {/* Approvals card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-slate-400"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 8l4 4 8-8" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-200">
                Approvals
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}/approvals`)}
              className="text-xs text-slate-500 hover:text-sky-400 transition-colors"
            >
              View all →
            </button>
          </div>
          {pendingCount === 0 &&
          approvedCount === 0 &&
          rejectedCount === 0 &&
          draftCount === 0 &&
          retranslateCount === 0 ? (
            <p className="text-sm text-slate-600">No reviews yet</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {pendingCount > 0 && (
                <StatBox
                  label="pending"
                  value={pendingCount}
                  color="text-amber-400"
                />
              )}
              {approvedCount > 0 && (
                <StatBox
                  label="approved"
                  value={approvedCount}
                  color="text-emerald-400"
                />
              )}
              {rejectedCount > 0 && (
                <StatBox
                  label="rejected"
                  value={rejectedCount}
                  color="text-red-400"
                />
              )}
              {draftCount > 0 && (
                <StatBox
                  label="draft"
                  value={draftCount}
                  color="text-slate-400"
                />
              )}
              {retranslateCount > 0 && (
                <StatBox
                  label="retranslated"
                  value={retranslateCount}
                  color="text-sky-400"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <ProjectFormModal
        open={editOpen}
        title="Edit project"
        project={project}
        loading={update.isPending}
        error={update.error instanceof Error ? update.error.message : undefined}
        onClose={() => setEditOpen(false)}
        onSubmit={(values) => {
          update.mutate(
            { projectId: project.id, input: values },
            { onSuccess: () => setEditOpen(false) },
          );
        }}
      />
    </div>
  );
}
