'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import AuthForm from './AuthForm';

export default function LoginForm() {
  const router = useRouter();

  const onSubmit = async (fields: { email: string; password: string }) => {
    const result = await signIn('credentials', {
      email: fields.email,
      password: fields.password,
      redirect: false,
    });

    if (result?.error) {
      return {
        ok: false,
        error: result.error,
      };
    }

    return { ok: true };
  };

  const onSuccess = () => {
    router.push('/admin');
  };

  return (
    <div>
      <h1>Admin Login</h1>
      <AuthForm onSubmit={onSubmit} onSuccess={onSuccess} />
    </div>
  );
}
