// app/HomePage/page.tsx
"use client"; // Marks this as a client component
import BackToHomeButton from "../components/BackToHomeButton";
import HomeLayout from "../components/HomeLayout"; // Import the new HomeLayout component
import Link from "next/link"; // For navigation between subpages

export default function HomePage() {
  return (
    <HomeLayout>
      {/* Unique content of the HomePage */}
      <div className="flex flex-col items-center p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Our Home Page</h1>
        <p className="text-lg mb-6">
          Explore our platform to learn more about us and our features.
        </p>

        {/* Navigation Links to Subpages */}
        <div className="flex gap-4">
          <Link
            href="/HomePage/services"
            className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
          >
            Our Services
          </Link>
          <Link
            href="/HomePage/signUp"
            className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </HomeLayout>
  );
}
