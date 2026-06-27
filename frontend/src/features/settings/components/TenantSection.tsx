import type { AuthUser } from '../../auth/types';
import { SettingsField } from './SettingsField';

type TenantSectionProps = {
  user: AuthUser;
};

export function TenantSection({ user }: TenantSectionProps) {
  const tenant = user.tenant;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <h2 className="text-lg font-medium text-white">Organization</h2>
        <p className="mt-1 text-sm text-slate-400">
          Tenant details for your workspace. Renaming is not available yet.
        </p>
      </div>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <SettingsField label="Organization name" value={tenant?.name ?? '—'} />
        <SettingsField label="Slug" value={tenant?.slug ?? '—'} mono />
        {tenant?.plan && (
          <SettingsField label="Plan" value={tenant.plan} />
        )}
        <SettingsField label="Tenant ID" value={user.tenantId} mono />
      </dl>
    </section>
  );
}
