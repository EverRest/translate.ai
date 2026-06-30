import { useState } from 'react';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import { Modal } from '../../../shared/ui/Modal';
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from '../hooks/useProjectSettings';

type ApiKeysPanelProps = {
  projectId: string;
  projectName: string;
};

export function ApiKeysPanel({ projectId, projectName }: ApiKeysPanelProps) {
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const { data: keys, isLoading, error } = useApiKeys(projectId);
  const create = useCreateApiKey(projectId);
  const revoke = useRevokeApiKey(projectId);

  const exampleCurl = createdSecret
    ? `curl -X POST http://localhost:3000/api/v1/jobs \\
  -H "Authorization: Bearer ${createdSecret}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "languages": ["de"],
    "keyItems": [
      { "key": "greeting.hello", "sourceText": "Hello world" }
    ]
  }'
# provider is optional — defaults to server AI_PROVIDER (e.g. gemini)`
    : '';

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
        <p>
          Each API key is permanently bound to this project only (
          <span className="text-slate-200">{projectName}</span>
          ). It cannot access other projects.
        </p>
        <p className="mt-2 font-mono text-xs text-slate-500">{projectId}</p>
        <p className="mt-2">
          Use in clients as{' '}
          <span className="font-mono text-slate-300">
            Authorization: Bearer ta_live_…
          </span>
        </p>
      </div>

      <form
        className="flex flex-wrap gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            return;
          }
          create.mutate(name.trim(), {
            onSuccess: (data) => {
              setName('');
              setCreatedSecret(data.secret);
            },
          });
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Key name (e.g. CI pipeline)"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Create API key
        </button>
      </form>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && (
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : 'Failed to load API keys.'}
        </p>
      )}

      {(keys?.length ?? 0) === 0 && !isLoading && (
        <p className="text-sm text-slate-500">No API keys yet.</p>
      )}

      <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
        {keys?.map((key) => (
          <li
            key={key.id}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <span className="text-white">{key.name}</span>
            <button
              type="button"
              disabled={revoke.isPending}
              onClick={async () => {
                if (
                  await confirm({
                    title: `Revoke API key "${key.name}"?`,
                    description:
                      'This key will stop working immediately. This action cannot be undone.',
                    danger: true,
                    confirmLabel: 'Revoke',
                  })
                ) {
                  revoke.mutate(key.id);
                }
              }}
              className="text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>

      <Modal
        title="API key created"
        open={Boolean(createdSecret)}
        onClose={() => setCreatedSecret(null)}
      >
        <p className="text-sm text-slate-400">
          Copy this secret now. It will not be shown again. Use it as{' '}
          <span className="font-mono text-slate-300">
            Authorization: Bearer &lt;secret&gt;
          </span>
          .
        </p>
        <code className="mt-4 block break-all rounded-lg bg-slate-950 p-3 text-xs text-emerald-300">
          {createdSecret}
        </code>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (createdSecret) {
                void navigator.clipboard.writeText(createdSecret);
              }
            }}
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            Copy API key
          </button>
          <button
            type="button"
            onClick={() => {
              if (createdSecret) {
                void navigator.clipboard.writeText(
                  `export API_KEY="${createdSecret}"`,
                );
              }
            }}
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            Copy export command
          </button>
        </div>
        {exampleCurl && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-slate-500">Example job request:</p>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
              {exampleCurl}
            </pre>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(exampleCurl)}
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              Copy curl example
            </button>
          </div>
        )}
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
