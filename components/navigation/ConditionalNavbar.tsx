"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Don't render navbar on dashboard routes or the RSS page (which is embedded in an iframe)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/rss")) {
    return null;
  }

  return <Navbar />;
} 