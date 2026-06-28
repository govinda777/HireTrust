import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import PrivyAuthContext from '../components/auth/privy-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HireTrust',
  description: 'Orquestrador de Compromissos Verificáveis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PrivyAuthContext>
          {children}
        </PrivyAuthContext>
      </body>
    </html>
  );
}
