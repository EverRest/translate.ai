import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import type { Project } from '../../projects/types';
import {
  useCreateKnowledgeSource,
  useDeleteKnowledgeSource,
  useKnowledgeSources,
  useUploadKnowledgeFile,
} from '../hooks/useKnowledge';
import type { KnowledgeSource } from '../types';

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }
  return `${(value / 1024).toFixed(1)} KB`;
}

function statusClass(status: KnowledgeSource['status']) {
  switch (status) {
    case 'ready':
      return 'text-emerald-400';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-amber-400';
  }
}

export function ProjectKnowledgePage() {
  const confirm = useConfirm();
  const { projectId } = useParams<{ projectId: string }>();
  useOutletContext<{ project: Project }>();

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState<'text' | 'markdown'>('markdown');
  const [pollPending, setPollPending] = useState(false);

  const sources = useKnowledgeSources(projectId, pollPending);
  const create = useCreateKnowledgeSource(projectId ?? '');
  const upload = useUploadKnowledgeFile(projectId ?? '');
  const remove = useDeleteKnowledgeSource(projectId ?? '');

  const items = sources.data ?? [];
  const hasPending = items.some((item) => item.status === 'pending');

  useEffect(() => {
    setPollPending(hasPending);
  }, [hasPending]);

  if (!projectId) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white">Knowledge</h2>
        <p className="mt-1 text-sm text-slate-400">
          Upload project context for RAG. Chunks are embedded and retrieved
          during translation when relevant.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(
              { name, sourceType, content },
              {
                onSuccess: () => {
                  setName('');
                  setContent('');
                  setPollPending(true);
                },
              },
            );
          }}
        >
          <h3 className="text-base font-medium text-white">Paste content</h3>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Source name"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            required
          />
          <select
            value={sourceType}
            onChange={(event) =>
              setSourceType(event.target.value as 'text' | 'markdown')
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
          >
            <option value="markdown">Markdown</option>
            <option value="text">Plain text</option>
          </select>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste brand guide, product docs, or terminology notes…"
            rows={8}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            required
          />
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {create.isPending ? 'Queueing…' : 'Add source'}
          </button>
          {create.error instanceof Error && (
            <p className="text-sm text-red-400">{create.error.message}</p>
          )}
        </form>

        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-base font-medium text-white">Upload file</h3>
          <p className="text-sm text-slate-400">Supported: `.txt`, `.md`</p>
          <input
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) {
                return;
              }
              setPollPending(true);
              upload.mutate({ file, name: file.name });
            }}
            className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:text-white"
          />
          {upload.error instanceof Error && (
            <p className="text-sm text-red-400">{upload.error.message}</p>
          )}
        </div>
      </div>

      {sources.isLoading && <p className="text-slate-400">Loading sources…</p>}

      {!sources.isLoading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          No knowledge sources yet.
        </div>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/80 text-left text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Chunks</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((source) => (
                <tr
                  key={source.id}
                  className="border-t border-slate-800 text-slate-200"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {source.name}
                  </td>
                  <td className="px-4 py-3">{source.sourceType}</td>
                  <td
                    className={`px-4 py-3 capitalize ${statusClass(source.status)}`}
                  >
                    {source.status}
                  </td>
                  <td className="px-4 py-3">{source.chunkCount}</td>
                  <td className="px-4 py-3">{formatBytes(source.byteSize)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={async () => {
                        if (
                          await confirm({
                            title: `Delete "${source.name}"?`,
                            description:
                              'All embedded chunks for this source will be removed.',
                            danger: true,
                            confirmLabel: 'Delete',
                          })
                        ) {
                          remove.mutate(source.id);
                        }
                      }}
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
