// app/components/ProtectedRoute.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../Context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mountedOnce, setMountedOnce] = useState(false);

  useEffect(() => {
    setMountedOnce(true);
  }, []);

  useEffect(() => {
    console.log('Protected Route - User:', user, 'IsLoading:', isLoading);
    
    // Only redirect if we're not loading and have mounted
    if (!isLoading && mountedOnce && !user) {
      console.log('Redirecting to home - no user found');
      router.push('/');
    }
  }, [user, isLoading, router, mountedOnce]);

  // Show loading state only initially
  if (isLoading && !mountedOnce) {
    return <div>Loading...</div>;
  }

  // Return children if we have a user or are still in initial load
  return user || isLoading ? <>{children}</> : null;
}