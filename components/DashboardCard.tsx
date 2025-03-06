// components/DashboardCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
    title: string;
    icon: LucideIcon;
    href: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon: Icon, href }) => {
    return (
        <Link href={href} className="block">
            <div className="border p-6 rounded-lg shadow-lg flex flex-col items-center justify-center h-40 w-40 mx-auto hover:bg-gray-50 transition-colors cursor-pointer">
                <Icon className="h-8 w-8 mb-4 text-gray-700" />
                <h3 className="text-lg font-semibold text-center text-gray-800">{title}</h3>
            </div>
        </Link>
    );
};

export default DashboardCard;