import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { z } from 'zod';
import { Modal } from '../../../shared/ui/Modal';
import { CONTENT_TYPE_OPTIONS } from '../contentTypes';
import type { TranslationKey } from '../types';

const contentTypeSchema = z.string().optional();

const createSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  sourceText: z.string().min(1, 'Source text is required'),
  description: z.string().optional(),
  context: z.string().optional(),
  contentType: contentTypeSchema,
});

const editSchema = z.object({
  sourceText: z.string().min(1, 'Source text is required'),
  description: z.string().optional(),
  context: z.string().optional(),
  contentType: contentTypeSchema,
});

export type CreateKeyFormValues = z.infer<typeof createSchema>;
export type EditKeyFormValues = z.infer<typeof editSchema>;

function ContentTypeSelect({
  id,
  register,
}: {
  id: string;
  register: UseFormRegister<{ contentType?: string }>;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300" htmlFor={id}>
        Content type
      </label>
      <select
        id={id}
        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
        {...register('contentType')}
      >
        {CONTENT_TYPE_OPTIONS.map((option) => (
          <option key={option.value || 'auto'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-slate-500">
        Guides AI tone and length. Auto uses keywords from context/description.
      </p>
    </div>
  );
}

type CreateModalProps = {
  open: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: CreateKeyFormValues) => void;
};

export function CreateTranslationKeyModal({
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
    formState: { errors },
  } = useForm<CreateKeyFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      key: '',
      sourceText: '',
      description: '',
      context: '',
      contentType: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        key: '',
        sourceText: '',
        description: '',
        context: '',
        contentType: '',
      });
    }
  }, [open, reset]);

  return (
    <Modal title="Add translation key" open={open} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm text-slate-300" htmlFor="key">
            Key
          </label>
          <input
            id="key"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-sky-500"
            placeholder="cart.checkout"
            {...register('key')}
          />
          {errors.key && (
            <p className="mt-1 text-sm text-red-400">{errors.key.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-300" htmlFor="sourceText">
            Source text
          </label>
          <input
            id="sourceText"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
            {...register('sourceText')}
          />
          {errors.sourceText && (
            <p className="mt-1 text-sm text-red-400">
              {errors.sourceText.message}
            </p>
          )}
        </div>

        <ContentTypeSelect id="contentType" register={register} />

        <div>
          <label className="block text-sm text-slate-300" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            placeholder="What this string is (e.g. checkout button label)"
            {...register('description')}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300" htmlFor="context">
            Context
          </label>
          <textarea
            id="context"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            placeholder="Where it appears (e.g. cart page footer)"
            {...register('context')}
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
            {loading ? 'Saving…' : 'Add key'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

type EditModalProps = {
  open: boolean;
  translationKey: TranslationKey | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: EditKeyFormValues) => void;
};

export function EditTranslationKeyModal({
  open,
  translationKey,
  loading,
  error,
  onClose,
  onSubmit,
}: EditModalProps) {
  const { register, handleSubmit, reset } = useForm<EditKeyFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      sourceText: '',
      description: '',
      context: '',
      contentType: '',
    },
  });

  useEffect(() => {
    if (open && translationKey) {
      reset({
        sourceText: translationKey.sourceText ?? '',
        description: translationKey.description ?? '',
        context: translationKey.context ?? '',
        contentType: translationKey.contentType ?? '',
      });
    }
  }, [open, translationKey, reset]);

  if (!translationKey) {
    return null;
  }

  return (
    <Modal title="Edit translation key" open={open} onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm">
          <p className="font-mono text-sky-300">{translationKey.key}</p>
        </div>

        <div>
          <label
            className="block text-sm text-slate-300"
            htmlFor="edit-sourceText"
          >
            Source text
          </label>
          <textarea
            id="edit-sourceText"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            {...register('sourceText')}
          />
          <p className="mt-1 text-xs text-slate-500">
            Changing source text marks existing translations as stale (needs
            review).
          </p>
        </div>

        <ContentTypeSelect id="edit-contentType" register={register} />

        <div>
          <label
            className="block text-sm text-slate-300"
            htmlFor="edit-description"
          >
            Description
          </label>
          <textarea
            id="edit-description"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            {...register('description')}
          />
        </div>

        <div>
          <label
            className="block text-sm text-slate-300"
            htmlFor="edit-context"
          >
            Context
          </label>
          <textarea
            id="edit-context"
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-500"
            {...register('context')}
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
