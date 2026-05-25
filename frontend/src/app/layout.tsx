import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Agroturismo Panama - Turismo Rural y Sostenible',
    template: '%s | Agroturismo Panama',
  },
  description:
    'Descubre experiencias unicas de agroturismo en Panama. Hospedajes rurales, actividades al aire libre, transfers y alquiler de vehiculos para explorar la naturaleza panamena.',
  keywords: [
    'agroturismo',
    'panama',
    'turismo rural',
    'hospedaje rural',
    'actividades naturaleza',
    'ecoturismo',
    'turismo sostenible',
  ],
  authors: [{ name: 'Agroturismo Panama' }],
  openGraph: {
    type: 'website',
    locale: 'es_PA',
    siteName: 'Agroturismo Panama',
    title: 'Agroturismo Panama - Turismo Rural y Sostenible',
    description:
      'Descubre experiencias unicas de agroturismo en Panama. Hospedajes rurales, actividades al aire libre y mas.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
