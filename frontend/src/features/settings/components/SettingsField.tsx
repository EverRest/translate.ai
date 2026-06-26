type SettingsFieldProps = {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
};

export function SettingsField({
  label,
  value,
  hint,
  mono,
}: SettingsFieldProps) {
  return (
    <div>
      <dt className="text-sm text-slate-400">{label}</dt>
      <dd
        className={[
          'mt-1 text-sm text-white',
          mono ? 'font-mono text-xs break-all' : '',
        ].join(' ')}
      >
        {value}
      </dd>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
