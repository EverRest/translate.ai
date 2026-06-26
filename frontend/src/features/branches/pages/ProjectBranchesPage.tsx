import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import type { Project } from '../../projects/types';
import { BranchDiffTable } from '../components/BranchDiffTable';
import { BranchesTable } from '../components/BranchesTable';
import { CreateBranchModal } from '../components/CreateBranchModal';
import {
  useBranchDiff,
  useBranches,
  useCreateBranch,
  useMergeBranch,
  useUpdateBranchTranslation,
} from '../hooks/useBranches';
import type { BranchDiffItem, ProjectBranch } from '../types';

const MUTATION_ROLES = new Set(['admin', 'developer']);

export function ProjectBranchesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();
  const { user } = useAuth();

  const canMutate = user?.role ? MUTATION_ROLES.has(user.role) : false;
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<ProjectBranch | null>(
    null,
  );
  const [savingKey, setSavingKey] = useState<string>();

  const { data: branches, isLoading, error } = useBranches(projectId);
  const diff = useBranchDiff(projectId, selectedBranch?.id);
  const create = useCreateBranch(projectId ?? '');
  const merge = useMergeBranch(projectId ?? '');
  const updateTranslation = useUpdateBranchTranslation(
    projectId ?? '',
    selectedBranch?.id ?? '',
  );

  const items = branches ?? [];
  const diffItems = diff.data ?? [];
  const activeBranch =
    selectedBranch &&
    !selectedBranch.isDefault &&
    selectedBranch.status === 'active'
      ? selectedBranch
      : null;

  if (!projectId) {
    return null;
  }

  const handleSave = (item: BranchDiffItem, value: string) => {
    const key = `${item.translationKeyId}:${item.language}`;
    setSavingKey(key);
    updateTranslation.mutate(
      {
        translationKeyId: item.translationKeyId,
        language: item.language,
        value,
      },
      { onSettled: () => setSavingKey(undefined) },
    );
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Branches</h2>
          <p className="mt-1 text-sm text-slate-400">
            Git-like translation branches. Edit on a feature branch, review
            diff, then merge to main.
          </p>
        </div>
        {canMutate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            New branch
          </button>
        )}
      </div>

      {!canMutate && (
        <p className="text-sm text-slate-500">
          Creating branches and merging require admin or developer role.
        </p>
      )}

      {isLoading && <p className="text-slate-400">Loading branches…</p>}
      {error && (
        <p className="text-red-400">
          {error instanceof Error ? error.message : 'Failed to load branches.'}
        </p>
      )}

      {items.length > 0 && (
        <BranchesTable
          branches={items}
          selectedId={selectedBranch?.id}
          onSelect={setSelectedBranch}
        />
      )}

      {activeBranch && (
        <>
          {diff.isLoading && <p className="text-slate-400">Loading diff…</p>}
          {diff.error && (
            <p className="text-red-400">
              {diff.error instanceof Error
                ? diff.error.message
                : 'Failed to load diff.'}
            </p>
          )}
          {!diff.isLoading && !diff.error && (
            <BranchDiffTable
              items={diffItems}
              branchName={activeBranch.name}
              canEdit={canMutate}
              canMerge={canMutate}
              merging={merge.isPending}
              savingKey={savingKey}
              onMerge={() => {
                if (
                  window.confirm(
                    `Merge "${activeBranch.name}" into main? This updates main translations.`,
                  )
                ) {
                  merge.mutate(activeBranch.id, {
                    onSuccess: () => {
                      setSelectedBranch(null);
                      void diff.refetch();
                    },
                  });
                }
              }}
              onSave={handleSave}
            />
          )}
        </>
      )}

      <CreateBranchModal
        open={createOpen}
        loading={create.isPending}
        error={create.error instanceof Error ? create.error.message : undefined}
        onClose={() => setCreateOpen(false)}
        onSubmit={(name) => {
          create.mutate(name, {
            onSuccess: (branch) => {
              setCreateOpen(false);
              setSelectedBranch(branch);
            },
          });
        }}
      />
    </section>
  );
}
