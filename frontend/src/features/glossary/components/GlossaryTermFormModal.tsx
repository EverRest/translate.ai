import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Modal } from '../../../shared/ui/Modal';
import type { GlossaryTerm } from '../types';

const createSchema = z
  .object({
    sourceTerm: z.string().min(1, 'Source term is required'),
    targetTerm: z.string().optional(),
    doNotTranslate: z.boolean(),
    note: z.string().optional(),
  })
  .refine((values) => values.doNotTranslate || values.targetTerm?.trim(), {
    message: 'Enter a target term or enable do not translate',
    path: ['targetTerm'],
  });

const editSchema = z.object({
  sourceTerm: z.string().min(1, 'Source term is required'),
  targetTerm: z.string().optional(),
  doNotTranslate: z.boolean(),
  note: z.string().optional(),
});

export type CreateGlossaryTermFormValues = z.infer<typeof createSchema>;
export type EditGlossaryTermFormValues = z.infer<typeof editSchema>;

type CreateModalProps = {
  open: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CreateGlossaryTermFormValues) => void;
};

export function CreateGlossaryTermModal({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: CreateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateGlossaryTermFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      sourceTerm: '',
      targetTerm: '',
      doNotTranslate: false,
      note: '',
    },
  });

  const doNotTranslate = watch('doNotTranslate');

  useEffect(() => {
    if (open) {
      reset({
        sourceTerm: '',
        targetTerm: '',
        doNotTranslate: false,
        note: '',
      });
    }
  }, [open, reset]);

  return (
    <Modal title="Add glossary term" open={open} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm text-slate-300" htmlFor="sourceTerm">
            Source term
          </label>
          <input
            id="sourceTerm"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
            placeholder="Checkout"
            {...register('sourceTerm')}
          />
          {errors.sourceTerm && (
            <p className="mt-1 text-sm text-red-400">
              {errors.sourceTerm.message}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" {...register('doNotTranslate')} />
          Do not translate (keep unchanged)
        </label>

        {!doNotTranslate && (
          <div>
            <label
              className="block text-sm text-slate-300"
              htmlFor="targetTerm"
            >
              Preferred translation
            </label>
            <input
              id="targetTerm"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              placeholder="Kasse"
              {...register('targetTerm')}
            />
            {errors.targetTerm && (
              <p className="mt-1 text-sm text-red-400">
                {errors.targetTerm.message}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300" htmlFor="note">
            Note (optional)
          </label>
          <textarea
            id="note"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
            {...register('note')}
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
            {loading ? 'Saving…' : 'Add term'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

type EditModalProps = {
  open: boolean;
  term: GlossaryTerm | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: EditGlossaryTermFormValues) => void;
};

export function EditGlossaryTermModal({
  open,
  term,
  loading,
  error,
  onClose,
  onSubmit,
}: EditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditGlossaryTermFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      sourceTerm: '',
      targetTerm: '',
      doNotTranslate: false,
      note: '',
    },
  });

  const doNotTranslate = watch('doNotTranslate');

  useEffect(() => {
    if (open && term) {
      reset({
        sourceTerm: term.sourceTerm,
        targetTerm: term.targetTerm ?? '',
        doNotTranslate: term.doNotTranslate,
        note: term.note ?? '',
      });
    }
  }, [open, term, reset]);

  return (
    <Modal title="Edit glossary term" open={open} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label
            className="block text-sm text-slate-300"
            htmlFor="edit-sourceTerm"
          >
            Source term
          </label>
          <input
            id="edit-sourceTerm"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
            {...register('sourceTerm')}
          />
          {errors.sourceTerm && (
            <p className="mt-1 text-sm text-red-400">
              {errors.sourceTerm.message}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" {...register('doNotTranslate')} />
          Do not translate (keep unchanged)
        </label>

        {!doNotTranslate && (
          <div>
            <label
              className="block text-sm text-slate-300"
              htmlFor="edit-targetTerm"
            >
              Preferred translation
            </label>
            <input
              id="edit-targetTerm"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              {...register('targetTerm')}
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300" htmlFor="edit-note">
            Note (optional)
          </label>
          <textarea
            id="edit-note"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
            {...register('note')}
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
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
