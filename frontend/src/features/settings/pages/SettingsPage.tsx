import { useAuth } from '../../auth/hooks/useAuth';
import { ProfileSection } from '../components/ProfileSection';
import { TenantSection } from '../components/TenantSection';
import { AccountUsageSection } from '../components/AccountUsageSection';
import { useAccountUsage } from '../../analytics/hooks/useAnalytics';

export function SettingsPage() {
  const { user, isLoading } = useAuth();
  const accountUsage = useAccountUsage(Boolean(user));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Account, subscription, and organization usage for your tenant.
        </p>
      </div>

      {isLoading && <p className="text-slate-400">Loading profile…</p>}

      {!isLoading && !user && (
        <p className="text-red-400">Unable to load your profile.</p>
      )}

      {user && (
        <div className="space-y-6">
          <ProfileSection user={user} />
          <TenantSection user={user} />
          {accountUsage.isLoading && (
            <p className="text-slate-400">Loading usage statistics…</p>
          )}
          {accountUsage.data && (
            <AccountUsageSection data={accountUsage.data} />
          )}
          {accountUsage.isError && !accountUsage.data && (
            <p className="text-sm text-slate-500">
              Usage statistics are not available right now.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
