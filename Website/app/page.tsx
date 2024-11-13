"use client";
import HomeLayout from "../app/components/HomeLayout";
import "../app/HomePage/HomePage.css";
import { useAuth } from '../app/Context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  // If user is already authenticated, redirect to FaceScreenshot
  useEffect(() => {
    if (user) {
      router.push('/FaceScreenshot');
    }
  }, [user, router]);

  const handleGoogleLogin = () => {
    window.location.href = process.env.NEXT_PUBLIC_AUTH_URL;
  };

  return (
    <HomeLayout>
      <div className="home-page-container flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Facial Rec</h1>
        <p className="text-lg mb-8 max-w-md leading-relaxed">
          A secure, cloud-based storage system with advanced facial recognition technology.
        </p>

        <div className="button-group">
          <button
            onClick={handleGoogleLogin}
            className="custom-button px-6 py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 shadow-lg"
          >
            Sign Up / Login with Google
          </button>
        </div>
      </div>
    </HomeLayout>
  );
}
