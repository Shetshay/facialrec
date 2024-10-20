"use client"; // Marks this as a client component
import HomeLayout from "../app/components/HomeLayout"; // Import the new HomeLayout component
import Link from "next/link"; // For navigation between subpages
import "../app/HomePage/HomePage.css"; // Import custom CSS

export default function HomePage() {
  return (
    <HomeLayout>
      {/* Unique content of the HomePage */}
      <div className="home-page-container flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Facial Rec</h1>
        <p className="text-lg mb-8 max-w-md leading-relaxed">
          A secure, cloud-based storage system with advanced facial recognition technology.
        </p>

        {/* Navigation Links to Subpages */}
        <div className="button-group">
          <Link
            href="/user"
            className="custom-button px-6 py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 shadow-lg"
          >
            Sign Up
          </Link>
          <Link
            href="/user"
            className="custom-button px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-black transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </HomeLayout>
  );
}
