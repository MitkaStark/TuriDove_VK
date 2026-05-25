import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TuriDove — Viajes boutique, hoteles, actividades y paquetes',
    template: '%s | TuriDove',
  },
  description:
    'Reserva hoteles boutique, actividades únicas, vehículos y paquetes de viaje internacionales. Experiencias curadas con atención personalizada.',
  keywords: [
    'turismo',
    'hoteles',
    'paquetes turísticos',
    'actividades',
    'vehículos',
    'viajes boutique',
  ],
  authors: [{ name: 'TuriDove' }],
  openGraph: {
    type: 'website',
    locale: 'es',
    siteName: 'TuriDove',
    title: 'TuriDove — Tu agencia de viajes boutique',
    description:
      'Hoteles, actividades, vehículos y paquetes de viaje internacionales.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${playfair.variable} ${dmSans.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
