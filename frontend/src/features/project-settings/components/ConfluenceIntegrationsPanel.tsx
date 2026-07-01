import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ColumnMappingFields } from '../../import/components/ColumnMappingFields';
import {
  toParseRulesInput,
  type ColumnMapping,
} from '../../import/utils/column-mapping.utils';
import { useToast } from '../../../shared/ui/use-toast';
import {
  useCompleteConfluenceConnect,
  useConfluenceConnect,
  useConfluenceIntegration,
  useConfluencePages,
  useConfluencePendingSites,
  useConfluenceSpaces,
  useConfluenceSync,
  useDisconnectConfluence,
  useUpdateConfluenceConfig,
} from '../hooks/useConfluenceIntegration';
import type { ConfluenceOAuthSetupHint } from '../types/confluence';

type ConfluencePanelProps = {
  projectId: string;
};

const SYNC_INTERVALS = [
  { value: 60, label: 'Every hour' },
  { value: 360, label: 'Every 6 hours' },
  { value: 1440, label: 'Daily' },
];

function OAuthSetupNotice({
  projectId,
  setupHint,
}: {
  projectId: string;
  setupHint: ConfluenceOAuthSetupHint;
}) {
  return (
    <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-4 text-sm text-amber-100/90">
      <p className="font-medium text-amber-200">
        Atlassian OAuth is not configured
        {setupHint.credentialSource === 'tenant'
          ? ' for this tenant'
          : ' on this server'}
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-amber-100/80">
        {setupHint.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {setupHint.envVars.length > 0 && (
        <p className="mt-2 text-amber-100/80">
          Environment variables:{' '}
          <code className="text-xs text-amber-200">
            {setupHint.envVars.join(', ')}
          </code>
        </p>
      )}
      <p className="mt-2">
        <a
          href={setupHint.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 hover:underline"
        >
          Atlassian OAuth 3LO documentation →
        </a>
      </p>
      <p className="mt-3 text-slate-400">
        File import works without OAuth —{' '}
        <Link
          to={`/projects/${projectId}/import`}
          className="text-sky-400 hover:underline"
        >
          Project → Import
        </Link>
      </p>
    </div>
  );
}

export function ConfluenceIntegrationsPanel({
  projectId,
}: ConfluencePanelProps) {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const integration = useConfluenceIntegration(projectId);
  const connect = useConfluenceConnect(projectId);
  const completeConnect = useCompleteConfluenceConnect(projectId);
  const disconnect = useDisconnectConfluence(projectId);
  const updateConfig = useUpdateConfluenceConfig(projectId);
  const sync = useConfluenceSync(projectId);

  const pendingToken = searchParams.get('pendingToken');
  const pickSiteMode = searchParams.get('confluence') === 'pick_site';
  const pendingSites = useConfluencePendingSites(
    projectId,
    pickSiteMode ? pendingToken : null,
  );

  const connected = integration.data?.connected ?? false;
  const oauthAvailable = integration.data?.oauthAvailable ?? false;
  const setupHint = integration.data?.setupHint ?? null;
  const spaces = useConfluenceSpaces(projectId, connected);
  const [spaceId, setSpaceId] = useState<string>('');
  const [labelFilter, setLabelFilter] = useState('');
  const pages = useConfluencePages(
    projectId,
    spaceId || null,
    connected,
    labelFilter || undefined,
  );
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [autoApply, setAutoApply] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState(360);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});

  useEffect(() => {
    const cfg = integration.data?.syncConfig;
    if (cfg) {
      setSelectedPageIds(cfg.pageIds);
      setAutoApply(cfg.autoApply);
      setLabelFilter(cfg.labelFilter ?? '');
      setSyncEnabled(cfg.syncEnabled);
      if (cfg.syncIntervalMinutes) {
        setSyncIntervalMinutes(cfg.syncIntervalMinutes);
      }
      setColumnMapping(cfg.parseRulesJson?.columnMapping ?? {});
      if (cfg.spaceKey && spaces.data?.length) {
        const match = spaces.data.find((s) => s.key === cfg.spaceKey);
        if (match) setSpaceId(match.id);
      }
    }
  }, [integration.data, spaces.data]);

  useEffect(() => {
    const status = searchParams.get('confluence');
    if (!status) return;
    if (status === 'connected') {
      toast.success('Confluence connected successfully.');
    } else if (status === 'error') {
      toast.error('Confluence connection failed. Try again.');
    }
    if (status !== 'pick_site') {
      searchParams.delete('confluence');
      searchParams.delete('pendingToken');
      setSearchParams(searchParams, { replace: true });
      void integration.refetch();
    }
  }, [searchParams, setSearchParams, toast, integration]);

  const buildConfigPayload = () => ({
    pageIds: selectedPageIds,
    spaceKey: spaces.data?.find((s) => s.id === spaceId)?.key,
    autoApply,
    labelFilter: labelFilter.trim() || null,
    parseRulesJson: toParseRulesInput(columnMapping) ?? null,
    syncEnabled,
    syncIntervalMinutes: syncEnabled ? syncIntervalMinutes : null,
  });

  const togglePage = (pageId: string) => {
    setSelectedPageIds((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId],
    );
  };

  const handleSaveConfig = async () => {
    try {
      await updateConfig.mutateAsync(buildConfigPayload());
      toast.success('Confluence sync settings saved.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings.',
      );
    }
  };

  const handleSync = async () => {
    try {
      if (selectedPageIds.length === 0) {
        toast.error('Select at least one page.');
        return;
      }
      await updateConfig.mutateAsync(buildConfigPayload());
      const result = await sync.mutateAsync(autoApply);
      toast.success(
        autoApply
          ? 'Sync started — keys will be applied when complete.'
          : `Sync started — review import session ${result.sessionId.slice(0, 8)}…`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed.');
    }
  };

  const handlePickSite = async (cloudId: string) => {
    if (!pendingToken) return;
    try {
      const result = await completeConnect.mutateAsync({
        pendingToken,
        cloudId,
      });
      toast.success(`Connected to ${result.siteName}.`);
      searchParams.delete('confluence');
      searchParams.delete('pendingToken');
      setSearchParams(searchParams, { replace: true });
      void integration.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connect failed.');
    }
  };

  if (integration.isLoading) {
    return <p className="text-slate-400">Loading Confluence integration…</p>;
  }

  if (pickSiteMode && pendingToken) {
    return (
      <div className="space-y-4">
        <h3 className="text-base font-medium text-white">
          Select Confluence site
        </h3>
        <p className="text-sm text-slate-400">
          Your Atlassian account has access to multiple Confluence sites. Choose
          one for this project.
        </p>
        <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
          {(pendingSites.data ?? []).map((site) => (
            <li key={site.id}>
              <button
                type="button"
                disabled={completeConnect.isPending}
                onClick={() => void handlePickSite(site.id)}
                className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-slate-800/50"
              >
                <span className="text-sm font-medium text-slate-100">
                  {site.name}
                </span>
                <span className="text-xs text-slate-500">{site.url}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="space-y-4">
        {!oauthAvailable && setupHint && (
          <OAuthSetupNotice projectId={projectId} setupHint={setupHint} />
        )}
        <p className="text-sm text-slate-400">
          Connect your Atlassian Confluence site to sync translation keys from
          selected pages.
        </p>
        <button
          type="button"
          disabled={!oauthAvailable || connect.isPending}
          onClick={() => connect.mutate()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {connect.isPending ? 'Redirecting…' : 'Connect Confluence'}
        </button>
      </div>
    );
  }

  const cfg = integration.data?.syncConfig;
  const conn = integration.data?.connection;

  return (
    <div className="space-y-6">
      {!oauthAvailable && setupHint && (
        <OAuthSetupNotice projectId={projectId} setupHint={setupHint} />
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-white">Confluence</h3>
          <p className="mt-1 text-sm text-slate-400">
            Connected to{' '}
            <a
              href={conn?.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:underline"
            >
              {conn?.siteName ?? conn?.siteUrl}
            </a>
          </p>
        </div>
        <button
          type="button"
          onClick={() => disconnect.mutate()}
          className="text-sm text-red-400 hover:text-red-300"
        >
          Disconnect
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Space</span>
          <select
            value={spaceId}
            onChange={(e) => {
              setSpaceId(e.target.value);
              setSelectedPageIds([]);
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="">Select space…</option>
            {(spaces.data ?? []).map((space) => (
              <option key={space.id} value={space.id}>
                {space.name} ({space.key})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Label filter (optional)</span>
          <input
            type="text"
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            placeholder="e.g. translations"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={autoApply}
            onChange={(e) => setAutoApply(e.target.checked)}
            className="rounded border-slate-600"
          />
          Auto-apply after sync
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={syncEnabled}
            onChange={(e) => setSyncEnabled(e.target.checked)}
            className="rounded border-slate-600"
          />
          Scheduled sync (polling)
        </label>

        {syncEnabled && (
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="text-slate-400">Sync interval</span>
            <select
              value={syncIntervalMinutes}
              onChange={(e) => setSyncIntervalMinutes(Number(e.target.value))}
              className="max-w-xs rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              {SYNC_INTERVALS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {spaceId && (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800">
          {(pages.data ?? []).length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              No pages found{labelFilter ? ` with label "${labelFilter}"` : ''}.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {(pages.data ?? []).map((page) => (
                <li key={page.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-slate-800/50">
                    <input
                      type="checkbox"
                      checked={selectedPageIds.includes(page.id)}
                      onChange={() => togglePage(page.id)}
                    />
                    <span className="text-sm text-slate-200">{page.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-sm text-sky-400 hover:underline"
        >
          {showAdvanced ? 'Hide' : 'Show'} column mapping
        </button>
        {showAdvanced && (
          <div className="mt-3 rounded-lg border border-slate-800 p-4">
            <ColumnMappingFields
              value={columnMapping}
              onChange={setColumnMapping}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSaveConfig()}
          disabled={updateConfig.isPending}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Save selection
        </button>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={
            !oauthAvailable || sync.isPending || selectedPageIds.length === 0
          }
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {sync.isPending ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {cfg?.lastSyncedAt && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm">
          <p className="text-slate-300">
            Last sync: {new Date(cfg.lastSyncedAt).toLocaleString()} —{' '}
            <span className="text-slate-400">{cfg.lastSyncStatus}</span>
          </p>
          {cfg.nextSyncAt && cfg.syncEnabled && (
            <p className="mt-1 text-slate-500">
              Next scheduled sync: {new Date(cfg.nextSyncAt).toLocaleString()}
            </p>
          )}
          {cfg.lastSyncSummary && (
            <p className="mt-1 text-slate-400">
              +{cfg.lastSyncSummary.create ?? 0} new, ~
              {cfg.lastSyncSummary.update ?? 0} updated,{' '}
              {cfg.lastSyncSummary.unchanged ?? 0} unchanged
            </p>
          )}
          {cfg.lastErrorMessage && (
            <p className="mt-1 text-red-400">{cfg.lastErrorMessage}</p>
          )}
          {cfg.lastImportSessionId && !autoApply && (
            <p className="mt-2">
              <Link
                to={`/projects/${projectId}/import`}
                className="text-sky-400 hover:underline"
              >
                Open import preview →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
