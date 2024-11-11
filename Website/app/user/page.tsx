"use client";
import Layout from "../components/Layout";
import Image from "next/image";
import { useAuth } from "../Context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Dynamically import the Pie component
const Pie = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), {
  ssr: false,
});

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
  const { user } = useAuth();
  const [storageStats, setStorageStats] = useState<BucketStats>({
    usedStorage: 0,
    totalStorage: 100,
    percentageUsed: 0,
    fileTypeDistribution: [],
  });
  const [files, setFiles] = useState<FileObject[]>([]);

  const calculateStorageStats = (files: FileObject[]) => {
    let totalSize = 0;
    const typeMap = new Map<string, number>();

    const getFileType = (file: FileObject) => {
      if (file.type === "folder") return "Folders";

      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) return "Images";
      if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension)) return "Documents";
      if (["mp4", "avi", "mov", "wmv"].includes(extension)) return "Videos";
      if (["mp3", "wav", "ogg"].includes(extension)) return "Audio";
      if (["zip", "rar", "7z"].includes(extension)) return "Archives";
      return "Others";
    };

    // Add debug logging for file sizes
    files.forEach((file) => {
      if (file.type === "file") {
        console.log(`File: ${file.name}, Original size: ${file.size} bytes`);
        totalSize += Number(file.size); // Ensure size is a number
        const fileType = getFileType(file);
        typeMap.set(fileType, (typeMap.get(fileType) || 0) + Number(file.size));
      }
    });

    const distribution = Array.from(typeMap.entries()).map(([type, size]) => ({
      type,
      size: Number(size), // Ensure size is a number
    }));

    // Debug logs
    console.log('Total size in bytes:', totalSize);
    console.log('Total size in MB:', totalSize / (1024 * 1024));
    console.log('Distribution:', distribution);

    return {
      usedStorage: Number((totalSize / (1024 * 1024)).toFixed(2)), // Convert to MB and fix decimal places
      totalStorage: 1000, // 1GB limit in MB
      percentageUsed: Number(((totalSize / (1024 * 1024 * 1024)) * 100).toFixed(2)), // Convert to percentage with 2 decimal places
      fileTypeDistribution: distribution,
    };
  };

  const fetchAllFiles = async (path: string = ""): Promise<FileObject[]> => {
    try {
      const queryPath = path ? `?path=${encodeURIComponent(path)}` : "";
      const response = await fetch(
        `http://localhost:3000/api/listBucket${queryPath}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const filesArray = Array.isArray(data.files) ? data.files : [];
        console.log('Files fetched:', filesArray);
        let allFiles: FileObject[] = [...filesArray];

        // Recursively get files from subfolders
        for (const file of filesArray) {
          if (file.type === "folder") {
            const folderPath = path ? `${path}/${file.name}` : file.name;
            const subFiles = await fetchAllFiles(folderPath);
            allFiles = allFiles.concat(subFiles);
          }
        }

        return allFiles;
      }
      return [];
    } catch (error) {
      console.error("Error fetching files:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const allFiles = await fetchAllFiles();
      setFiles(allFiles);
      const stats = calculateStorageStats(allFiles);
      console.log('Storage Stats:', stats);
      setStorageStats(stats);
    };

    fetchData();
    // Refresh every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getChartData = () => {
    const labels = storageStats.fileTypeDistribution.map(
      (item) => `${item.type} (${formatBytes(item.size)})` // Add size to labels
    );
    const data = storageStats.fileTypeDistribution.map((item) => item.size);

    console.log('Chart Data:', {
      labels,
      data,
      total: data.reduce((a, b) => a + b, 0),
    });

    return {
      labels,
      datasets: [
        {
          label: 'Storage Usage',
          data,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8E44AD', '#2ECC71', '#E74C3C', '#3498DB',
          ],
          hoverBackgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8E44AD', '#2ECC71', '#E74C3C', '#3498DB',
          ],
        },
      ],
    };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <ProtectedRoute>
      <Layout>
        <h1 className="text-2xl font-bold text-white-800 mb-6">User Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Info Box */}
          <div className="w-full bg-white rounded-lg shadow-md p-6">
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

          {/* Storage Usage Box */}
          <div className="w-full bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Storage Usage</h3>
            <p className="text-sm text-gray-600 mb-2">
              You are using {storageStats.usedStorage.toFixed(2)}MB out of{' '}
              {storageStats.totalStorage}MB
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
              <div
                className={`h-6 rounded-full transition-all duration-300 ${
                  storageStats.percentageUsed > 90
                    ? 'bg-red-500'
                    : storageStats.percentageUsed > 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
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

          {/* File Type Distribution Chart */}
          {storageStats.fileTypeDistribution.length > 0 && (
            <div className="w-full bg-white rounded-lg shadow-md p-6 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Storage Distribution by File Type
              </h3>
              <div className="w-full h-[800px] flex items-center justify-center">
                <div style={{ width: '80%', height: '80%' }}>
                  <Pie
                    data={getChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            boxWidth: 5,
                            padding: 20,
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: (context: any) => {
                              const value = context.raw;
                              return ` ${formatBytes(value)}`;
                            },
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
