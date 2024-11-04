"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../Context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const [mountedOnce, setMountedOnce] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!mountedOnce) {
        setMountedOnce(true);
        await checkAuth();
      }
      
      if (!isLoading && !user) {
        console.log('No user found in protected route, redirecting...');
        router.push('/');
      }
    };

    verifyAuth();
  }, [user, isLoading, router, mountedOnce, checkAuth]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything
  if (!user) {
    return null;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
}