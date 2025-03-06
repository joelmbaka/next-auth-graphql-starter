// app/(app)/dashboard/page.tsx
'use client';

import { Suspense } from 'react';
import ChatInput from '@/components/ChatInput';
import DashboardCard from '@/components/DashboardCard';
import { Newspaper, Calendar, Briefcase, BarChart } from 'lucide-react';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';

export default function DashboardPage() {
    return (
        <div className="flex flex-col h-screen p-4 rounded-lg">
            <div className="flex-grow">
                <h1 className="text-xl md:text-2xl font-bold text-center">Welcome to the Engine Room</h1>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                    <Suspense fallback={<div className="w-64 h-32 bg-gray-200 rounded-lg animate-pulse" />}>
                        <DashboardCard title="News Feed" icon={Newspaper} href="/dashboard/feed" />
                    </Suspense>
                    <Suspense fallback={<div className="w-64 h-32 bg-gray-200 rounded-lg animate-pulse" />}>
                        <DashboardCard title="View My Appointments" icon={Calendar} href="#" />
                    </Suspense>
                    <Suspense fallback={<div className="w-64 h-32 bg-gray-200 rounded-lg animate-pulse" />}>
                        <DashboardCard title="Start a New Business" icon={Briefcase} href="#" />
                    </Suspense>
                    <Suspense fallback={<div className="w-64 h-32 bg-gray-200 rounded-lg animate-pulse" />}>
                        <DashboardCard title="Go to Analytics" icon={BarChart} href="#" />
                    </Suspense>
                </div>
            </div>
            <div className="p-4 border-t">
                <ChatInput />
            </div>
        </div>
    );
}