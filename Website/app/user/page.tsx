"use client";

import Layout from "../components/Layout";
import Image from "next/image";
import { useAuth } from '../Context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function UserPage() {
  const { user } = useAuth();
  const totalStorage = 10; // 10GB total storage
  const usedStorage = 6.5; // 6.5GB used, as an example
  const percentageUsed = (usedStorage / totalStorage) * 100;

  return (
    <ProtectedRoute>
      <Layout>
        <h1 className="text-2xl font-bold text-white-800 mb-6">User Profile</h1>
        <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <Image
              src="/stock.jpg"
              alt="User Avatar"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              {user && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-md font-semibold text-gray-700">User Details</h3>
            <ul className="mt-2 text-gray-600 space-y-1">
              <li>Role: User</li>
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

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
            <div
              className="h-6 rounded-full transition-all duration-300"
              style={{
                width: `${percentageUsed}%`,
                backgroundColor: "#9acd32",
              }}
            ></div>
          </div>

          <p className="text-sm text-gray-600">
            {percentageUsed}% of your storage is used.
          </p>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}