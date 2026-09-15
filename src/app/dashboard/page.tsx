'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SkeletonCard, SkeletonText } from '@/components/ui/Skeleton';

export default function DashboardIndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user?.isDeveloper) {
        router.replace('/dashboard/developer');
      } else if (user?.isOwner) {
        router.replace('/dashboard/owner');
      } else {
        router.replace('/dashboard/properties');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <SkeletonText className="w-48 h-8" />
        <SkeletonText className="w-96 h-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
      </div>
    </div>
  );
}
