import { useState } from 'react';
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { useConfirm } from '../../../shared/ui/ConfirmDialog';
import { useProjectLanguages } from '../../project-settings/hooks/useProjectSettings';
import type { Project } from '../../projects/types';
import { AddNodeModal } from '../components/AddNodeModal';
import { ObjectTree } from '../components/ObjectTree';
import {
  useApplyObjectTemplate,
  useCreateLocalizationNode,
  useDeleteLocalizationNode,
  useGenerateObjectStructure,
  useLocalizationObject,
  useMaterializeLocalizationObject,
  useObjectTemplates,
  useTranslateLocalizationObject,
  useUpdateLocalizationNode,
} from '../hooks/useLocalizationObjects';

export function ProjectObjectDetailPage() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { projectId, objectId } = useParams<{
    projectId: string;
    objectId: string;
  }>();
  useOutletContext<{ project: Project }>();

  const [addOpen, setAddOpen] = useState(false);
  const [parentId, setParentId] = useState<string | undefined>();
  const [parentSlug, setParentSlug] = useState<string | undefined>();
  const [materializeMessage, setMaterializeMessage] = useState<string>();
  const [translateMessage, setTranslateMessage] = useState<string>();
  const [structureMessage, setStructureMessage] = useState<string>();

  const {
    data: object,
    isLoading,
    error,
  } = useLocalizationObject(projectId, objectId, true);
  const { data: languages = [] } = useProjectLanguages(projectId);
  const { data: templates = [] } = useObjectTemplates(projectId);

  const createNode = useCreateLocalizationNode(projectId ?? '', objectId ?? '');
  const updateNode = useUpdateLocalizationNode(projectId ?? '', objectId ?? '');
  const deleteNode = useDeleteLocalizationNode(projectId ?? '', objectId ?? '');
  const materialize = useMaterializeLocalizationObject(
    projectId ?? '',
    objectId ?? '',
  );
  const translate = useTranslateLocalizationObject(
    projectId ?? '',
    objectId ?? '',
  );
  const generateStructure = useGenerateObjectStructure(
    projectId ?? '',
    objectId ?? '',
  );
  const applyTemplate = useApplyObjectTemplate(projectId ?? '', objectId ?? '');

  if (!projectId || !objectId) {
    return null;
  }

  if (isLoading) {
    return <p className="text-slate-400">Loading object…</p>;
  }

  if (error || !object) {
    return (
      <p className="text-red-400">
        {error instanceof Error ? error.message : 'Object not found.'}
      </p>
    );
  }

  const targetLanguages = languages
    .filter((lang) => !lang.isDefault)
    .map((lang) => lang.code);

  const isGenerating =
    object.generationStatus === 'queued' ||
    object.generationStatus === 'generating';

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            <Link
              to={`/projects/${projectId}/objects`}
              className="hover:text-slate-300"
            >
              Objects
            </Link>{' '}
            / {object.name}
          </p>
          <h2 className="mt-1 text-xl font-medium text-white">{object.name}</h2>
          <p className="mt-1 font-mono text-xs text-slate-500">{object.slug}</p>
          {object.description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              {object.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={generateStructure.isPending || isGenerating}
            onClick={async () => {
              await generateStructure.mutateAsync();
              setStructureMessage('AI structure generation queued…');
            }}
            className="rounded-lg border border-violet-800/60 bg-violet-950/30 px-3 py-2 text-sm text-violet-200 hover:bg-violet-950/50 disabled:opacity-50"
          >
            {isGenerating ? 'Generating…' : 'Generate with AI'}
          </button>
          {templates.length > 0 && (
            <select
              defaultValue=""
              disabled={applyTemplate.isPending || isGenerating}
              onChange={async (event) => {
                const templateId = event.target.value;
                if (!templateId) {
                  return;
                }
                if (
                  !(await confirm({
                    title: 'Apply template?',
                    description:
                      'This replaces the current tree. Materialized keys may need re-materializing.',
                    confirmLabel: 'Apply',
                  }))
                ) {
                  event.target.value = '';
                  return;
                }
                const result = await applyTemplate.mutateAsync(templateId);
                setStructureMessage(`Applied template: ${result.templateName}`);
                event.target.value = '';
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="">Apply template…</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => {
              setParentId(undefined);
              setParentSlug(undefined);
              setAddOpen(true);
            }}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-800"
          >
            Add root node
          </button>
          <button
            type="button"
            disabled={materialize.isPending}
            onClick={async () => {
              const result = await materialize.mutateAsync();
              setMaterializeMessage(
                `Materialized ${result.total} keys (${result.created} created, ${result.updated} updated).`,
              );
            }}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {materialize.isPending ? 'Materializing…' : 'Materialize keys'}
          </button>
          <button
            type="button"
            disabled={translate.isPending || targetLanguages.length === 0}
            onClick={async () => {
              const result = await translate.mutateAsync(targetLanguages);
              setTranslateMessage(`Translation job ${result.jobId} created.`);
              navigate(`/jobs/${result.jobId}`);
            }}
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50"
            title={
              targetLanguages.length === 0
                ? 'Add target languages in Settings first'
                : undefined
            }
          >
            {translate.isPending ? 'Starting job…' : 'Translate all'}
          </button>
          <Link
            to={`/projects/${projectId}/translations`}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Translations grid
          </Link>
        </div>
      </div>

      {structureMessage && (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            object.generationStatus === 'failed'
              ? 'border-red-900/40 bg-red-950/20 text-red-300'
              : 'border-violet-900/40 bg-violet-950/20 text-violet-200'
          }`}
        >
          {object.generationStatus === 'failed' && object.generationError
            ? `Generation failed: ${object.generationError}`
            : structureMessage}
        </p>
      )}
      {materializeMessage && (
        <p className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
          {materializeMessage}
        </p>
      )}
      {translateMessage && (
        <p className="rounded-lg border border-sky-900/40 bg-sky-950/20 px-3 py-2 text-sm text-sky-300">
          {translateMessage}
        </p>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-slate-300">Structure</h3>
          <p className="text-xs text-slate-500">
            {object.nodeCount} nodes · {object.materializedCount} materialized
          </p>
        </div>

        <ObjectTree
          objectSlug={object.slug}
          nodes={object.tree}
          onAddChild={(id, slug) => {
            setParentId(id);
            setParentSlug(slug);
            setAddOpen(true);
          }}
          onUpdateSourceText={(nodeId, sourceText) => {
            updateNode.mutate({ nodeId, input: { sourceText } });
          }}
          onDelete={async (nodeId) => {
            if (
              await confirm({
                title: 'Delete node?',
                description: 'Child nodes are removed too.',
                danger: true,
                confirmLabel: 'Delete',
              })
            ) {
              await deleteNode.mutateAsync(nodeId);
            }
          }}
          deletingNodeId={
            deleteNode.isPending ? deleteNode.variables : undefined
          }
          updatingNodeId={
            updateNode.isPending ? updateNode.variables?.nodeId : undefined
          }
        />
      </div>

      <AddNodeModal
        open={addOpen}
        parentSlug={parentSlug}
        loading={createNode.isPending}
        error={
          createNode.error instanceof Error
            ? createNode.error.message
            : undefined
        }
        onClose={() => setAddOpen(false)}
        onSubmit={async (values) => {
          await createNode.mutateAsync({
            ...values,
            parentId,
          });
          setAddOpen(false);
        }}
      />
    </section>
  );
}
