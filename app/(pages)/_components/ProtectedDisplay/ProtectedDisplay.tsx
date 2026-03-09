import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function ProtectedDisplay({
  allowedRoles,
  allowedUsers,
  failRedirectRoute,
  children,
}: {
  allowedRoles: string[];
  allowedUsers?: string[];
  failRedirectRoute: string;
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect(failRedirectRoute);
  }

  if (
    !allowedRoles.includes(session.user.role) ||
    (allowedUsers &&
      !allowedUsers.includes(session.user.email.trim().toLowerCase()))
  ) {
    redirect('/');
  }

  return <>{children}</>;
}
