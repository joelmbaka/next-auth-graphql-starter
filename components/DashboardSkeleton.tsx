export function DashboardSkeleton() {
    return (
        <div className="flex flex-col h-screen p-4 rounded-lg animate-pulse">
            <div className="flex-grow">
                <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
            </div>
            <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-64 h-32 bg-gray-200 rounded-lg" />
                    ))}
                </div>
            </div>
            <div className="p-4 border-t">
                <div className="h-12 bg-gray-200 rounded" />
            </div>
        </div>
    );
} 