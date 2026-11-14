import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NECTAR - Stream Movies',
  description: 'Movie streaming platform',
  verification: {
    google: '6sOH3IBCwxCz5A',
  },
};

// Map country codes to primary spoken languages
const COUNTRY_TO_LANG: Record<string, string> = {
  // Swahili-speaking regions
  KE: 'sw',
  TZ: 'sw',
  // French-speaking regions
  FR: 'fr',
  CD: 'fr',
  CG: 'fr',
  CI: 'fr',
  SN: 'fr',
  CM: 'fr',
  BE: 'fr',
  CA: 'fr',
  // Spanish-speaking regions
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  // Portuguese-speaking regions
  BR: 'pt',
  PT: 'pt',
  AO: 'pt',
  MZ: 'pt',
  // Arabic-speaking regions
  AE: 'ar',
  SA: 'ar',
  EG: 'ar',
  MA: 'ar',
  // English-speaking & default regions
  UG: 'en',
  US: 'en',
  GB: 'en',
  NG: 'en',
  GH: 'en',
  ZA: 'en',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const country = headersList.get('x-vercel-ip-country')?.toUpperCase() || 'UG';
  const acceptLang = headersList.get('accept-language') || '';

  // Determine language on the server safely to match client output
  const browserLang = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase() || 'en';
  const detectedLang = COUNTRY_TO_LANG[country] || browserLang || 'en';

  return (
    <html lang={detectedLang} data-country={country} suppressHydrationWarning>
      <head>
        {/* Pre-warm vidlink.pro connection immediately on site load to eliminate stream cold-starts */}
        <link rel="preconnect" href="https://vidlink.pro" />
        <link rel="dns-prefetch" href="https://vidlink.pro" />
        <link rel="preconnect" href="https://image.tmdb.org" />
      </head>
      <body className="bg-[#141414] text-white antialiased">
        {children}
        <Analytics />

        {/* Adsterra Global Script (Social Bar) */}
        <Script
          id="adsterra-socialbar"
          src="https://bancadeltempoidea.org/14/58808fa5506f81df159760063720bcd9"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}