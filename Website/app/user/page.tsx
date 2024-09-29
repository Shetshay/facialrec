// app/user/page.tsx
"use client"; // Mark as a client component

import Layout from "../components/Layout"; // Use the Layout component
import Image from "next/image";

export default function UserPage() {
  return (
    <Layout>
      {" "}
      {/* Wrap the page content inside the Layout component */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">User Profile</h1>
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <Image
            src="/stock.jpg" // Ensure the image exists in the public folder
            alt="User Avatar"
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">John Doe</h2>
            <p className="text-gray-600">johndoe@example.com</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-700">User Details</h3>
          <ul className="mt-2 text-gray-600 space-y-1">
            <li>Role: Admin</li>
            <li>Joined: January 1, 2020</li>
            <li>Status: Active</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
