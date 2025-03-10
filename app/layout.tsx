import type { Metadata } from "next";
import "./globals.css";
import { Providers } from '@/components/providers';
import React from 'react';
import Navbar from '@/components/navigation/Navbar';

export const metadata: Metadata = {
  title: "Twinkle Gen",
  description: "a conversational ai platform for task automation and feedback",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="px-10">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}