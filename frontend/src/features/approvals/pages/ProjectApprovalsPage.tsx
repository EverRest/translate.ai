import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../../shared/api/types';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  EditTranslationModal,
  RejectTranslationModal,
  ReviewsTable,
} from '../components/ReviewsTable';
import {
  useApproveTranslation,
  useBulkApprove,
  useProjectReviews,
  usePublishTranslation,
  useRejectTranslation,
  useRetranslateTranslation,
  useUpdateTranslationValue,
} from '../hooks/useApprovals';
import type { ReviewItem, ReviewStatusFilter } from '../types';

const REVIEW_ROLES = new Set(['admin', 'reviewer']);

export function ProjectApprovalsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const canReview = user?.role ? REVIEW_ROLES.has(user.role) : false;

  const [tab, setTab] = useState<ReviewStatusFilter>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<ReviewItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<ReviewItem | null>(null);
  const [busyId, setBusyId] = useState<string>();

  const { data, isLoading, error } = useProjectReviews(projectId, tab);
  const approve = useApproveTranslation(projectId ?? '');
  const reject = useRejectTranslation(projectId ?? '');
  const publish = usePublishTranslation(projectId ?? '');
  const updateValue = useUpdateTranslationValue(projectId ?? '');
  const bulkApprove = useBulkApprove(projectId ?? '');
  const retranslate = useRetranslateTranslation(projectId ?? '');

  const items = data?.items ?? [];
  const forbidden = error instanceof ApiError && error.status === 403;

  if (!projectId) {
    return null;
  }

  if (!canReview) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-slate-300">
          Approvals require admin or reviewer role.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Your role: {user?.role ?? 'unknown'}
        </p>
      </div>
    );
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(undefined);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Approvals</h2>
          <p className="mt-1 text-sm text-slate-400">
            Review AI translations before publishing.
          </p>
        </div>
        {tab === 'pending' && selectedIds.length > 0 && (
          <button
            type="button"
            disabled={bulkApprove.isPending}
            onClick={() => {
              bulkApprove.mutate(selectedIds, {
                onSuccess: () => setSelectedIds([]),
              });
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {bulkApprove.isPending
              ? 'Approving…'
              : `Bulk approve (${selectedIds.length})`}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['pending', 'approved'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setSelectedIds([]);
            }}
            className={[
              'rounded-lg px-4 py-2 text-sm capitalize',
              tab === value
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white',
            ].join(' ')}
          >
            {value === 'pending' ? 'Pending review' : 'Ready to publish'}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-400">Loading reviews…</p>}
      {error && !forbidden && (
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load reviews.'}
        </p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          {tab === 'pending'
            ? 'No translations waiting for review.'
            : 'No approved translations ready to publish.'}
        </div>
      )}

      {items.length > 0 && (
        <ReviewsTable
          items={items}
          mode={tab}
          selectedIds={selectedIds}
          onToggle={toggleSelection}
          onToggleAll={setSelectedIds}
          busyId={busyId}
          onEdit={tab === 'pending' ? setEditingItem : undefined}
          onApprove={
            tab === 'pending'
              ? (id) => void runAction(id, () => approve.mutateAsync(id))
              : undefined
          }
          onReject={tab === 'pending' ? setRejectingItem : undefined}
          onRetranslate={
            tab === 'pending'
              ? (id) =>
                  void runAction(id, () => retranslate.mutateAsync(id))
              : undefined
          }
          onPublish={
            tab === 'approved'
              ? (id) => void runAction(id, () => publish.mutateAsync(id))
              : undefined
          }
        />
      )}

      <EditTranslationModal
        open={Boolean(editingItem)}
        item={editingItem}
        loading={updateValue.isPending}
        error={
          updateValue.error instanceof Error
            ? updateValue.error.message
            : undefined
        }
        onClose={() => setEditingItem(null)}
        onSave={(value) => {
          if (!editingItem) {
            return;
          }
          updateValue.mutate(
            { translationId: editingItem.id, value },
            { onSuccess: () => setEditingItem(null) },
          );
        }}
      />

      <RejectTranslationModal
        open={Boolean(rejectingItem)}
        item={rejectingItem}
        loading={reject.isPending}
        error={reject.error instanceof Error ? reject.error.message : undefined}
        onClose={() => setRejectingItem(null)}
        onConfirm={(comment) => {
          if (!rejectingItem) {
            return;
          }
          reject.mutate(
            { translationId: rejectingItem.id, comment: comment || undefined },
            { onSuccess: () => setRejectingItem(null) },
          );
        }}
      />
    </section>
  );
}
