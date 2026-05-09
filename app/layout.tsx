import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function resolveMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return new URL("http://localhost:3000");
  try {
    return new URL(raw);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Shalean · Book trusted home cleaning",
    template: "%s · Shalean",
  },
  description:
    "Book professional home cleaning online — clear scheduling, secure Paystack checkout, and live booking status from assignment to completion.",
  applicationName: "Shalean",
  openGraph: {
    title: "Shalean · Book trusted home cleaning",
    description:
      "Operational-grade booking: confirm your details, pay securely, and track every step through completion.",
    siteName: "Shalean",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shalean · Book trusted home cleaning",
    description:
      "Book professional cleaning with secure checkout and transparent booking status.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
