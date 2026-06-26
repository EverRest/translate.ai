import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Modal } from '../../../shared/ui/Modal';

const schema = z.object({
  name: z
    .string()
    .min(1, 'Branch name is required')
    .regex(
      /^[a-z0-9][a-z0-9-]*$/,
      'Use lowercase letters, numbers, and hyphens',
    ),
});

type FormValues = z.infer<typeof schema>;

type CreateBranchModalProps = {
  open: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function CreateBranchModal({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: CreateBranchModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  return (
    <Modal
      title="Create branch"
      open={open}
      onClose={() => {
        reset({ name: '' });
        onClose();
      }}
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => onSubmit(values.name))}
      >
        <p className="text-sm text-slate-400">
          Creates a snapshot of main translations you can edit before merging
          back.
        </p>

        <div>
          <label className="block text-sm text-slate-300" htmlFor="branch-name">
            Branch name
          </label>
          <input
            id="branch-name"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-sky-500"
            placeholder="staging"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create branch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
