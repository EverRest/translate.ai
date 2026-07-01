import type { ColumnMapping } from '../utils/column-mapping.utils';

type ColumnMappingFieldsProps = {
  value: ColumnMapping;
  onChange: (value: ColumnMapping) => void;
  disabled?: boolean;
};

const FIELDS: Array<{
  key: keyof ColumnMapping;
  label: string;
  placeholder: string;
}> = [
  { key: 'scope', label: 'Scope column', placeholder: 'Scope' },
  { key: 'key', label: 'Key column', placeholder: 'Key' },
  {
    key: 'sourceText',
    label: 'Source text column',
    placeholder: 'Default (EN)',
  },
  { key: 'hints', label: 'Hints column', placeholder: 'Hints' },
];

export function ColumnMappingFields({
  value,
  onChange,
  disabled,
}: ColumnMappingFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <label key={field.key} className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">{field.label}</span>
          <input
            type="text"
            disabled={disabled}
            value={value[field.key] ?? ''}
            placeholder={field.placeholder}
            onChange={(e) =>
              onChange({ ...value, [field.key]: e.target.value || undefined })
            }
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 disabled:opacity-50"
          />
        </label>
      ))}
      <p className="sm:col-span-2 text-xs text-slate-500">
        Leave blank to auto-detect from table headers (Scope, Key, Default EN,
        Hints).
      </p>
    </div>
  );
}
