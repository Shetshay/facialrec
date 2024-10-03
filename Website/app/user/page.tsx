"use client"; // Mark as a client component

import Layout from "../components/Layout"; // Use the Layout component
import Image from "next/image";
import { useState } from "react";

export default function UserPage() {
  // Placeholder for storage usage; this would come from your database
  const totalStorage = 10; // 10GB total storage
  const usedStorage = 6.5; // 6.5GB used, as an example

  // Calculate the percentage used
  const percentageUsed = (usedStorage / totalStorage) * 100;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-white-800 mb-6">User Profile</h1>
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6 mb-8">
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

      {/* Storage Box */}
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Storage Usage</h3>
        <p className="text-sm text-gray-600 mb-2">
          You are using {usedStorage}GB out of {totalStorage}GB.
        </p>

        {/* Placeholder Graph */}
        <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
          <div
            className="h-6 rounded-full"
            style={{
              width: `${percentageUsed}%`,
              backgroundColor: "#9acd32", // Light Yoda green for the used storage
            }}
          ></div>
        </div>

        <p className="text-sm text-gray-600">
          {percentageUsed}% of your storage is used.
        </p>
      </div>
    </Layout>
  );
}
