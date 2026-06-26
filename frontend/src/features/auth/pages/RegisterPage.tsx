import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useRegisterForm } from '../hooks/useAuth';

const schema = z.object({
  tenantName: z.string().min(2, 'Organization name is required'),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const registerForm = useRegisterForm();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tenantName: '', email: '', password: '' },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Register your organization on translate.ai
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={handleSubmit((values) => registerForm.mutate(values))}
        >
          <div>
            <label
              className="block text-sm text-slate-300"
              htmlFor="tenantName"
            >
              Organization name
            </label>
            <input
              id="tenantName"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              {...register('tenantName')}
            />
            {errors.tenantName && (
              <p className="mt-1 text-sm text-red-400">
                {errors.tenantName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-sky-500"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>

          {registerForm.isError && (
            <p className="text-sm text-red-400">
              {registerForm.error instanceof Error
                ? registerForm.error.message
                : 'Registration failed'}
            </p>
          )}

          <button
            type="submit"
            disabled={registerForm.isPending}
            className="w-full rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {registerForm.isPending ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-400 hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
