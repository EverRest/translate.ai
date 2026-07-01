import { useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import type { Project } from '../../projects/types';
import { ApiKeysPanel } from '../components/ApiKeysPanel';
import { LanguagesPanel } from '../components/LanguagesPanel';
import { WebhooksPanel } from '../components/WebhooksPanel';
import { ConfluenceIntegrationsPanel } from '../components/ConfluenceIntegrationsPanel';
import { DomainContextPanel } from '../components/DomainContextPanel';
import type { SettingsTab } from '../types';

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'domain', label: 'Domain context' },
  { id: 'languages', label: 'Languages' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'integrations', label: 'Integrations' },
];

export function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project } = useOutletContext<{ project: Project }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const [tab, setTab] = useState<SettingsTab>(
    tabParam && tabs.some((item) => item.id === tabParam)
      ? tabParam
      : 'languages',
  );

  if (!projectId) {
    return null;
  }

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    setSearchParams({ tab: next });
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white">Project settings</h2>
        <p className="mt-1 text-sm text-slate-400">
          Domain context, languages, API keys, webhooks, and integrations for
          this project.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTab(item.id)}
            className={[
              'rounded-t-lg px-4 py-2 text-sm',
              tab === item.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        {tab === 'domain' && <DomainContextPanel project={project} />}
        {tab === 'languages' && <LanguagesPanel projectId={projectId} />}
        {tab === 'api-keys' && (
          <ApiKeysPanel projectId={projectId} projectName={project.name} />
        )}
        {tab === 'webhooks' && (
          <WebhooksPanel projectId={projectId} projectName={project.name} />
        )}
        {tab === 'integrations' && (
          <ConfluenceIntegrationsPanel projectId={projectId} />
        )}
      </div>
    </section>
  );
}
