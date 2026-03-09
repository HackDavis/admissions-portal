import ProtectedDisplay from '../_components/ProtectedDisplay/ProtectedDisplay';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HackDavis Admin Panel',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.ADMISSIONS_ADMIN_EMAILS) {
    throw new Error('ADMISSIONS_ADMIN_EMAILS environment variable is not set');
  }
  const adminEmails = process.env.ADMISSIONS_ADMIN_EMAILS.split(',').map(
    (email) => email.trim()
  );

  return (
    <ProtectedDisplay
      allowedRoles={['admin']}
      allowedUsers={adminEmails}
      failRedirectRoute="/login"
    >
      {children}
    </ProtectedDisplay>
  );
}
