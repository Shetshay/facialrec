"use client"; // Marks this as a client component
import BackToHomeButton from "../components/BackToHomeButton";
import HomeLayout from "../components/HomeLayout"; // Import the new HomeLayout component
import Link from "next/link"; // For navigation between subpages

export default function HomePage() {
  return (
    <HomeLayout>
      {/* Unique content of the HomePage */}
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Facial Rec</h1>
        <p className="text-lg mb-6">
          A cloud-based storage system using facial recognition.
        </p>

        {/* Navigation Links to Subpages */}
        <div className="flex gap-4">
          <Link
            href="/user"
            className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
          >
            Sign Up
          </Link>
          <Link
            href="/user"
            className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    </HomeLayout>
  );
}
