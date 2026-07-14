import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Replace with your real deployed URL once live — every canonical/OG URL
// below is derived from this so there's exactly one place to update.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leave-ledger.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'LeaveLedger — Enterprise Leave Management System',
    template: '%s · LeaveLedger',
  },
  description: 'PTO requests, approvals, and balance tracking for managers, HR, and leadership — role-scoped dashboards for Employees, Managers, HR, and CEOs.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LeaveLedger — Enterprise Leave Management System',
    description: 'PTO requests, approvals, and balance tracking for managers, HR, and leadership.',
    url: siteUrl,
    siteName: 'LeaveLedger',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'LeaveLedger — Enterprise Leave Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeaveLedger — Enterprise Leave Management System',
    description: 'PTO requests, approvals, and balance tracking for managers, HR, and leadership.',
    images: ['/opengraph-image'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LeaveLedger',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'PTO requests, approvals, and balance tracking for managers, HR, and leadership.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased transition-colors duration-200`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
