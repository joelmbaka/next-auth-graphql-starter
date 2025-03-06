// app/dashboard/layout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        {/* Sidebar Section */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        {/* Main Content Area */}
        <main className="flex-1 p-4">
          {/* Optionally, include a trigger for mobile */}
          <SidebarTrigger className="md:hidden" />
          <Suspense fallback={<DashboardSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </SidebarProvider>
  );
}
