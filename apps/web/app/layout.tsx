import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Room Booking System',
    template: '%s | Room Booking System',
  },
  description: 'Manage meeting rooms, bookings, and users efficiently with our comprehensive room booking system',
  keywords: ['room booking', 'meeting rooms', 'booking system', 'admin dashboard'],
  authors: [{ name: 'Room Booking System' }],
  creator: 'Room Booking System',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Room Booking System',
    description: 'Manage meeting rooms and bookings efficiently',
    siteName: 'Room Booking System',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Room Booking System',
    description: 'Manage meeting rooms and bookings efficiently',
  },
  robots: {
    index: false, // Admin dashboard shouldn't be indexed
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <html lang="en">
      <head>
        {/* Preconnect to Supabase for faster API calls */}
        {supabaseUrl && (
          <>
            <link rel="preconnect" href={supabaseUrl} />
            <link rel="dns-prefetch" href={supabaseUrl} />
          </>
        )}
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
          <Toaster position="top-right" richColors closeButton />
        </ErrorBoundary>
      </body>
    </html>
  );
}
