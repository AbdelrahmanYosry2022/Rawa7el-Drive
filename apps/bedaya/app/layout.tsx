import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "منصة بداية - للحلقات القرآنية",
  description: "منصة متكاملة لإدارة الحلقات القرآنية وتسجيل الطلاب ومتابعة الحضور",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "بداية",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={arSA}>
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <body
          className={`${cairo.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <NextTopLoader 
            color="#10B981"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #10B981,0 0 5px #10B981"
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
