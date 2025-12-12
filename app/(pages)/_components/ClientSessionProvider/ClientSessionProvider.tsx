'use client';

import { SessionProvider } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function ClientSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return <SessionProvider key={pathname}>{children}</SessionProvider>;
}
