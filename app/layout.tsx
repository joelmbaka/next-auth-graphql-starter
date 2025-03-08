  import type { Metadata } from "next";
  import { Geist, Geist_Mono } from "next/font/google";
  import "./globals.css";
  import { Providers } from '@/app/providers';
  import React from 'react';
  import ConditionalNavbar from '@/components/navigation/ConditionalNavbar';

  const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });

  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });

  export const metadata: Metadata = {
    title: "Bramix Builders",
    description: "Bramix Builders",
  };

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body className="px-10">
          <Providers>
            <ConditionalNavbar />
            {children}
          </Providers>
        </body>
      </html>
    );
  }