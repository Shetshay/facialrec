"use client";
import Layout from "../components/Layout";
import Image from "next/image";
import { useAuth } from "../Context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { useEffect, useState } from "react";

interface BucketStats {
  usedStorage: number;
  totalStorage: number;
  percentageUsed: number;
}

export default function UserPage() {
  const { user } = useAuth();
  const [storageStats, setStorageStats] = useState<BucketStats>({
    usedStorage: 0,
    totalStorage: 100,
    percentageUsed: 0,
  });

  useEffect(() => {
    const fetchStorageStats = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/bucket-stats", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setStorageStats(data);
        }
      } catch (error) {
        console.error("Error fetching storage stats:", error);
      }
    };

    fetchStorageStats();
    // Set up interval to refresh stats every minute
    const interval = setInterval(fetchStorageStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ProtectedRoute>
      <Layout>
        <h1 className="text-2xl font-bold text-white-800 mb-6">User Profile</h1>

        {/* User Info Box */}
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
            <h3 className="text-md font-semibold text-gray-700">
              User Details
            </h3>
            <ul className="mt-2 text-gray-600 space-y-1">
              <li>Role: User</li>
              <li>Status: Active</li>
            </ul>
          </div>
        </div>

        {/* Storage Box */}
        <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Storage Usage
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            You are using {storageStats.usedStorage.toFixed(2)}MB out of{" "}
            {storageStats.totalStorage}MB
          </p>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
            <div
              className={`h-6 rounded-full transition-all duration-300 ${
                storageStats.percentageUsed > 90
                  ? "bg-red-500"
                  : storageStats.percentageUsed > 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(storageStats.percentageUsed, 100)}%`,
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {storageStats.percentageUsed.toFixed(1)}% of your storage is used
          </p>
          {storageStats.percentageUsed > 90 && (
            <p className="text-sm text-red-500 mt-2">
              Warning: You are approaching your storage limit!
            </p>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
