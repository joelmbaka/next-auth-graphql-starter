"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navigation/Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // If the current route starts with '/dashboard', do not render the public Navbar.
  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return <Navbar />;
} 