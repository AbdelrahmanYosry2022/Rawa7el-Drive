import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { createServerClient } from '@rawa7el/supabase';
import { Sidebar } from "@/components/dashboard/sidebar";
import { WelcomeModal } from "@/components/welcome-modal";
import { PageGuide } from "@/components/page-guide";
import { MobileNav } from "@/components/mobile-nav";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

const graphikArabic = localFont({
  src: [
    {
      path: "../public/fonts/GraphikArabic-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/GraphikArabic-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/GraphikArabic-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-graphik",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rawa7el Drive",
  description: "Rawa7el Drive educational platform for exams and analytics",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rawahel",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // Fetch user role from DB
  let userRole: 'ADMIN' | 'STUDENT' = 'STUDENT';
  if (isAuthenticated && user) {
    const { data: dbUser } = await supabase
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();
    if (dbUser) {
      userRole = dbUser.role as 'ADMIN' | 'STUDENT';
    }
  }

  const subjects = isAuthenticated
    ? (await supabase
        .from('Subject')
        .select('id, name, color')
        .order('createdAt', { ascending: false })).data || []
    : [];

  return (
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <body
          className={`${graphikArabic.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <NextTopLoader 
            color="#4F46E5"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #4F46E5,0 0 5px #4F46E5"
          />
          {isAuthenticated ? (
            <>
              <WelcomeModal />
              <PageGuide />
              {children}
            </>
          ) : (
            children
          )}
        </body>
      </html>
  );
}
