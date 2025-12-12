import type { Metadata } from 'next';
import ClientSessionProvider from './_components/ClientSessionProvider/ClientSessionProvider';
import '@globals/styles/globals.scss';
import metadataJSON from '@globals/metadata.json';
import fonts from './_globals/fonts';

export const metadata: Metadata = metadataJSON;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fonts} antialiased`}>
        <ClientSessionProvider>{children}</ClientSessionProvider>
      </body>
    </html>
  );
}
