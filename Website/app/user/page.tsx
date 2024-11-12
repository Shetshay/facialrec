"use client";
import Layout from "../components/Layout";
import Image from "next/image";
import { useAuth } from "../Context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { useEffect, useState, useRef } from "react";
import { Camera } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface FileObject {
  name: string;
  type: "file" | "folder";
  size: number;
  contentType: string;
  lastModified: string;
  path?: string;
}

interface BucketStats {
  usedStorage: number;
  totalStorage: number;
  percentageUsed: number;
  fileTypeDistribution: {
    type: string;
    size: number;
  }[];
}

export default function UserPage() {
  const { user, checkAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [storageStats, setStorageStats] = useState<BucketStats>({
    usedStorage: 0,
    totalStorage: 100,
    percentageUsed: 0,
    fileTypeDistribution: [],
  });

  // Colors for the pie chart
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#ff7c43', '#665191', '#2f4b7c'
  ];

  useEffect(() => {
    const fetchStorageData = async () => {
      try {
        const bucketResponse = await fetch('http://localhost:3000/api/listBucket', {
          credentials: 'include'
        });
        if (!bucketResponse.ok) throw new Error('Failed to fetch bucket data');
        const bucketData = await bucketResponse.json();
        setFiles(bucketData.files || []);

        const statsResponse = await fetch('http://localhost:3000/api/bucket-stats', {
          credentials: 'include'
        });
        if (!statsResponse.ok) throw new Error('Failed to fetch storage stats');
        const stats = await statsResponse.json();

        const typeMap = new Map<string, number>();
        bucketData.files?.forEach((file: FileObject) => {
          if (file.type === "file") {
            const type = getFileType(file.contentType, file.name);
            const currentSize = typeMap.get(type) || 0;
            typeMap.set(type, currentSize + file.size);
          }
        });

        const distribution = Array.from(typeMap.entries()).map(([type, size]) => ({
          type,
          size: Number((size / (1024 * 1024)).toFixed(2)) // Convert to MB
        }));

        setStorageStats({
          usedStorage: stats.usedStorage,
          totalStorage: stats.totalStorage,
          percentageUsed: stats.percentageUsed,
          fileTypeDistribution: distribution,
        });
      } catch (error) {
        console.error('Error fetching storage data:', error);
      }
    };

    fetchStorageData();
    const interval = setInterval(fetchStorageData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getFileType = (contentType: string, fileName: string): string => {
    if (!contentType || contentType === 'application/octet-stream') {
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'Images';
      if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'Documents';
      if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'Videos';
      if (['mp3', 'wav', 'ogg'].includes(ext)) return 'Audio';
      if (['zip', 'rar', '7z'].includes(ext)) return 'Archives';
      return 'Others';
    }

    if (contentType.startsWith('image/')) return 'Images';
    if (contentType.startsWith('video/')) return 'Videos';
    if (contentType.startsWith('audio/')) return 'Audio';
    if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text/')) return 'Documents';
    if (contentType.includes('zip') || contentType.includes('compressed')) return 'Archives';
    return 'Others';
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch(
        "http://localhost:3000/api/updateProfilePicture",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile picture");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await checkAuth();
      setImageError(false);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Failed to update profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <h1 className="text-2xl font-bold text-white-800 mb-6">User Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Info Box */}
          <div className="w-full bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-4">
              {user && (
                <div className="relative group">
                  <div
                    className="w-20 h-20 rounded-full overflow-hidden relative cursor-pointer"
                    onClick={handleProfilePictureClick}
                  >
                    <Image
                      src={user.profilePicture || "/default-profile.png"}
                      alt={`${user.firstName}'s Avatar`}
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                      onError={() => setImageError(true)}
                      priority
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploading ? (
                        <div className="animate-spin">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <Camera className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </div>
              )}
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

          {/* Storage Usage Box */}
          <div className="w-full bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Storage Usage
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              You are using {storageStats.usedStorage.toFixed(2)}MB out of{" "}
              {storageStats.totalStorage}MB
            </p>
            <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
              <div
                className={`h-6 rounded-full transition-all duration-300 ${
                  storageStats.percentageUsed > 90
                    ? "bg-red-500"
                    : storageStats.percentageUsed > 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                } float-left`}
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

          {/* Storage Distribution Chart */}
          {storageStats.fileTypeDistribution.length > 0 && (
  <div className="lg:col-span-2">
    <Card>
      <CardHeader>
        <CardTitle>Storage Distribution by File Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageStats.fileTypeDistribution}
                        dataKey="size"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={({ type, size }) => `${type} (${size.toFixed(2)} MB)`}
                      >
                        {storageStats.fileTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(2)} MB`}
                      />
                      <Legend />
                    </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}