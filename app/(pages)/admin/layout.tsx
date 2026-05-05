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
  const adminEmails = process.env.ADMISSIONS_ADMIN_EMAILS;

  if (!adminEmails) {
    console.warn(
      'ADMISSIONS_ADMIN_EMAILS environment variable is not set, no users will have access to the admin panel'
    );
  }

  const parsedAdminEmails = adminEmails
    ? adminEmails.split(',').map((email) => email.trim())
    : [];

  return (
    <ProtectedDisplay
      allowedRoles={['admin']}
      allowedUsers={parsedAdminEmails}
      failRedirectRoute="/login"
    >
      {children}
    </ProtectedDisplay>
  );
}
