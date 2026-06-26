import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Modal } from '../../../shared/ui/Modal';
import type { Project } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type ProjectFormModalProps = {
  open: boolean;
  title: string;
  project?: Project;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
};

export function ProjectFormModal({
  open,
  title,
  project,
  loading,
  error,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name ?? '',
        description: project?.description ?? '',
      });
    }
  }, [open, project, reset]);

  return (
    <Modal title={title} open={open} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm text-slate-300" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
            {...register('name')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-300" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
            {...register('description')}
          />
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
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
