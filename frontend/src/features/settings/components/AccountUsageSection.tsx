import type { AccountUsage } from '../../analytics/types';
import { TokenUsageCharts } from '../../analytics/components/TokenUsageCharts';
import { UsageSummaryStats } from '../../analytics/components/UsageSummaryStats';
import { SettingsField } from './SettingsField';

const planLabels: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

type AccountUsageSectionProps = {
  data: AccountUsage;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function AccountUsageSection({ data }: AccountUsageSectionProps) {
  const { tenant, lifetime, thisMonth, quotaUsedPercent, timeline } = data;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div>
          <h2 className="text-lg font-medium text-white">Subscription & usage</h2>
          <p className="mt-1 text-sm text-slate-400">
            Lifetime AI token usage for your organization (client tenant).
          </p>
        </div>

        <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SettingsField
            label="Plan"
            value={planLabels[tenant.plan] ?? tenant.plan}
          />
          <SettingsField label="Status" value={tenant.planStatus} />
          <SettingsField
            label="Member since"
            value={formatDate(tenant.subscriptionSince)}
          />
          <SettingsField
            label="Monthly token quota"
            value={
              tenant.monthlyTokenQuota
                ? tenant.monthlyTokenQuota.toLocaleString()
                : 'Unlimited'
            }
          />
        </dl>

        {quotaUsedPercent !== null && (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">This month quota used</span>
              <span className="text-white">{quotaUsedPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${quotaUsedPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {thisMonth.totalTokens.toLocaleString()} /{' '}
              {tenant.monthlyTokenQuota?.toLocaleString()} tokens this month
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base font-medium text-white">All-time totals</h3>
        <p className="mt-1 text-sm text-slate-400">
          Aggregated across all projects and users in {tenant.name}.
        </p>
      </div>

      <UsageSummaryStats summary={lifetime} />

      <TokenUsageCharts
        byModel={lifetime.byModel}
        byUser={lifetime.byUser}
        timeline={timeline}
      />
    </section>
  );
}
