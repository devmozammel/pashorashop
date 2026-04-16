
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Gallery Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="aspect-square rounded-xl w-full" />
                    <div className="flex gap-4">
                        <Skeleton className="w-20 h-20 rounded-lg" />
                        <Skeleton className="w-20 h-20 rounded-lg" />
                        <Skeleton className="w-20 h-20 rounded-lg" />
                    </div>
                </div>

                {/* Info Skeleton */}
                <div className="space-y-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-32" />

                    <div className="space-y-2 py-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>

                    <div className="space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex gap-3">
                            <Skeleton className="h-10 w-24 rounded-md" />
                            <Skeleton className="h-10 w-24 rounded-md" />
                        </div>
                    </div>

                    <div className="pt-6">
                        <Skeleton className="h-14 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
