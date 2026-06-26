import type { AuthUser } from '../../auth/types';
import { SettingsField } from './SettingsField';

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  developer: 'Developer',
  reviewer: 'Reviewer',
  translator: 'Translator',
};

type ProfileSectionProps = {
  user: AuthUser;
};

export function ProfileSection({ user }: ProfileSectionProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <h2 className="text-lg font-medium text-white">Profile</h2>
        <p className="mt-1 text-sm text-slate-400">
          Your account details. Profile editing is not available yet.
        </p>
      </div>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <SettingsField label="Email" value={user.email} />
        <SettingsField
          label="Role"
          value={roleLabels[user.role] ?? user.role}
        />
        <SettingsField label="User ID" value={user.id} mono />
      </dl>
    </section>
  );
}
