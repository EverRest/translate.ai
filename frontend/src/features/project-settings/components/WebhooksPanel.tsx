import { useState } from 'react';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import { Modal } from '../../../shared/ui/Modal';
import {
  useCreateWebhook,
  useDeleteWebhook,
  useUpdateWebhook,
  useWebhooks,
} from '../hooks/useProjectSettings';
import type { Webhook } from '../types';

type WebhooksPanelProps = {
  projectId: string;
  projectName: string;
};

export function WebhooksPanel({ projectId, projectName }: WebhooksPanelProps) {
  const confirm = useConfirm();
  const [url, setUrl] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const { data: webhooks, isLoading, error } = useWebhooks(projectId);
  const create = useCreateWebhook(projectId);
  const update = useUpdateWebhook(projectId);
  const remove = useDeleteWebhook(projectId);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
        <p>
          Webhooks for this project only (
          <span className="text-slate-200">{projectName}</span>
          ). Events are sent to your URL with an HMAC signature (
          <span className="font-mono text-slate-300">whsec_…</span>).
        </p>
        <p className="mt-2 font-mono text-xs text-slate-500">{projectId}</p>
      </div>

      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!url.trim()) {
            return;
          }
          create.mutate(
            { url: url.trim(), enabled: true },
            {
              onSuccess: (data) => {
                setUrl('');
                setCreatedSecret(data.secret);
              },
            },
          );
        }}
      >
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/webhooks/translate"
          className="min-w-[280px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Add webhook
        </button>
      </form>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && (
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load webhooks.'}
        </p>
      )}

      {(webhooks?.length ?? 0) === 0 && !isLoading && (
        <p className="text-sm text-slate-500">No webhooks configured.</p>
      )}

      <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
        {webhooks?.map((webhook) => (
          <WebhookRow
            key={webhook.id}
            webhook={webhook}
            onToggle={(enabled) =>
              update.mutate({ webhookId: webhook.id, input: { enabled } })
            }
            onDelete={async () => {
              if (
                await confirm({
                  title: 'Delete webhook?',
                  description: `Webhook ${webhook.url} will be permanently deleted.`,
                  danger: true,
                  confirmLabel: 'Delete',
                })
              ) {
                remove.mutate(webhook.id);
              }
            }}
            busy={update.isPending || remove.isPending}
          />
        ))}
      </ul>

      <Modal
        title="Webhook secret"
        open={Boolean(createdSecret)}
        onClose={() => setCreatedSecret(null)}
      >
        <p className="text-sm text-slate-400">
          Use this secret to verify HMAC signatures. Copy it now — it will not
          be shown again.
        </p>
        <code className="mt-4 block break-all rounded-lg bg-slate-950 p-3 text-xs text-emerald-300">
          {createdSecret}
        </code>
        <button
          type="button"
          onClick={() => setCreatedSecret(null)}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
        >
          Done
        </button>
      </Modal>
    </div>
  );
}

function WebhookRow({
  webhook,
  onToggle,
  onDelete,
  busy,
}: {
  webhook: Webhook;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  busy?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-white">{webhook.url}</p>
        <p className="mt-1 text-xs text-slate-500">
          {webhook.enabled ? 'Enabled' : 'Disabled'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-slate-300">
          <input
            type="checkbox"
            checked={webhook.enabled}
            disabled={busy}
            onChange={(event) => onToggle(event.target.checked)}
          />
          Active
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
