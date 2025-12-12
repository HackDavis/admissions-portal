import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function ProtectedDisplay({
  allowedRoles,
  failRedirectRoute,
  children,
}: {
  allowedRoles: string[];
  failRedirectRoute: string;
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect(failRedirectRoute);
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect('/');
  }

  return <>{children}</>;
}
