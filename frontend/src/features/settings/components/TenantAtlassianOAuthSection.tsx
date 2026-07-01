import { useState } from 'react';
import { useToast } from '../../../shared/ui/use-toast';
import {
  useDeleteTenantAtlassianOAuth,
  useTenantAtlassianOAuth,
  useUpsertTenantAtlassianOAuth,
} from '../hooks/useTenantAtlassianOAuth';

export function TenantAtlassianOAuthSection() {
  const toast = useToast();
  const query = useTenantAtlassianOAuth();
  const upsert = useUpsertTenantAtlassianOAuth();
  const remove = useDeleteTenantAtlassianOAuth();

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [scopes, setScopes] = useState('');

  const configured = query.data?.configured ?? false;

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error('Client ID and secret are required.');
      return;
    }
    try {
      await upsert.mutateAsync({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        redirectUri: redirectUri.trim() || undefined,
        scopes: scopes.trim() || undefined,
      });
      setClientSecret('');
      toast.success('Tenant Atlassian OAuth app saved.');
      void query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed.');
    }
  };

  const handleRemove = async () => {
    try {
      await remove.mutateAsync();
      setClientId('');
      setClientSecret('');
      setRedirectUri('');
      setScopes('');
      toast.success(
        'Tenant OAuth app removed — platform env vars will be used.',
      );
      void query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Remove failed.');
    }
  };

  if (query.isLoading) {
    return <p className="text-slate-400">Loading Atlassian integration…</p>;
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-lg font-medium text-white">Atlassian OAuth (BYO)</h2>
      <p className="mt-1 text-sm text-slate-400">
        Optional per-tenant OAuth app for Confluence live sync. Admin only.
        Overrides platform <code className="text-xs">ATLASSIAN_CLIENT_*</code>{' '}
        env vars.
      </p>

      {configured && query.data?.clientId && (
        <p className="mt-3 text-sm text-emerald-400">
          Configured — Client ID: {query.data.clientId}
          {query.data.redirectUri ? ` · ${query.data.redirectUri}` : ''}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Client ID</span>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder={query.data?.clientId ?? 'Atlassian app client ID'}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Client secret</span>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={configured ? '••••••••' : 'Secret'}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-slate-400">Redirect URI (optional)</span>
          <input
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            placeholder={
              query.data?.redirectUri ??
              'http://localhost:3000/api/v1/integrations/confluence/oauth/callback'
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-slate-400">Scopes (optional)</span>
          <input
            value={scopes}
            onChange={(e) => setScopes(e.target.value)}
            placeholder="read:confluence-content.all read:confluence-space.summary offline_access"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={upsert.isPending}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {upsert.isPending ? 'Saving…' : 'Save OAuth app'}
        </button>
        {configured && (
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={remove.isPending}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        )}
      </div>
    </section>
  );
}
