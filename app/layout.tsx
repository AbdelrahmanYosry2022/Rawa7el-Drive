import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Sidebar } from "@/components/dashboard/sidebar";
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
  title: "Al-Asas Academy",
  description: "Sharia Academy Educational Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl">
        <body
          className={`${graphikArabic.variable} ${geistMono.variable} antialiased`}
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
            <div className="flex h-screen overflow-hidden bg-slate-50">
              {/* Sidebar - fixed width, scrollable */}
              <Sidebar />
              
              {/* Main Content - flexible, scrollable */}
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          ) : (
            children
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
