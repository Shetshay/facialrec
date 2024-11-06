"use client";

import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { FaTimes, FaArrowLeft } from "react-icons/fa";
import FilePreview from "../components/FilePreview";
import { useAuth } from "../Context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export default function FilesPage() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>("");
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    const initializePage = async () => {
      if (!isLoading && !initialized) {
        setInitialized(true);
        await fetchFiles();
      }
    };
    initializePage();
  }, [isLoading]);

  useEffect(() => {
    if (initialized && !isLoading) {
      fetchFiles();
    }
  }, [currentPath, initialized]);

  const fetchFiles = async () => {
    try {
      const queryPath = currentPath
        ? `?path=${encodeURIComponent(currentPath)}`
        : "";
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
        setFiles(filesArray);
      } else {
        console.error("Failed to fetch files:", response.statusText);
        setFiles([]);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]);
    }
  };

  const handleDeleteItem = async (name: string, type: "file" | "folder") => {
    const fullPath = currentPath ? `${currentPath}/${name}` : name;

    try {
      const response = await fetch("http://localhost:3000/api/deleteFile", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: fullPath,
          type: type,
        }),
      });

      const data = await response.json();

      if (data.needsConfirmation) {
        const confirmed = window.confirm(
          `This folder contains ${data.count} item(s). Are you sure you want to delete the folder and all its contents?`
        );

        if (!confirmed) return;

        const deleteResponse = await fetch(
          "http://localhost:3000/api/deleteFile?confirmed=true",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: fullPath,
              type: type,
            }),
          }
        );

        if (!deleteResponse.ok) throw new Error("Failed to delete folder");
      }

      await fetchFiles();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  const handleNavigateToFolder = (folderPath: string) => {
    const newPath = currentPath ? `${currentPath}/${folderPath}` : folderPath;
    setCurrentPath(newPath);
  };

  const handleNavigateBack = () => {
    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    const newPath = pathParts.join("/");
    setCurrentPath(newPath);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFiles?.length) {
      alert("Please select at least one file to upload.");
      return;
    }

    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => {
      formData.append("files", file);
    });
    formData.append("path", currentPath);

    try {
      const response = await fetch("http://localhost:3000/api/uploadFile", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        await fetchFiles();
        setShowUploadModal(false);
        setSelectedFiles(null);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Please enter a folder name");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/createFolder", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderName: newFolderName,
          path: currentPath,
        }),
      });

      if (response.ok) {
        await fetchFiles();
        setShowNewFolderModal(false);
        setNewFolderName("");
      } else {
        throw new Error("Failed to create folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Files</h1>
            {user && (
              <p className="text-gray-600">Welcome, {user.firstName}!</p>
            )}
          </div>
          <div className="space-x-4">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              New Folder
            </button>
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Upload
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        {currentPath && (
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={handleNavigateBack}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <span className="text-gray-600">Current path: {currentPath}</span>
          </div>
        )}

        {/* Files Grid */}
        {files.length === 0 ? (
          <div className="text-center mt-8">
            <h2 className="text-xl text-gray-600">This folder is empty</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative bg-white shadow-lg rounded-lg flex flex-col h-full"
              >
                <FilePreview
                  file={{
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    contentType: file.contentType,
                    url:
                      file.type === "file"
                        ? `http://localhost:3000/api/downloadFile/${encodeURIComponent(
                            file.path || file.name
                          )}`
                        : undefined,
                  }}
                  onClick={() =>
                    file.type === "folder" && handleNavigateToFolder(file.name)
                  }
                />

                <div className="p-4 flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 break-words">
                    {file.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Last Modified:{" "}
                    {new Date(file.lastModified).toLocaleString()}
                  </p>
                  {file.type !== "folder" && (
                    <p className="text-sm text-gray-600">
                      Size: {formatFileSize(file.size)}
                    </p>
                  )}
                </div>

                {editMode && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(file.name, file.type);
                      }}
                      className="bg-white border-2 border-red-500 rounded-full p-1 hover:bg-red-50"
                    >
                      <FaTimes className="text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showNewFolderModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Folder</h2>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full p-2 border rounded mb-4"
                autoFocus
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName("");
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Upload Files</h2>
              <input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="mb-4"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  );
}

interface FileObject {
  name: string;
  lastModified: string;
  size: number;
  type: "file" | "folder";
  path?: string;
  contentType?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  let kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(2) + " KB";
  let mb = kb / 1024;
  if (mb < 1024) return mb.toFixed(2) + " MB";
  let gb = mb / 1024;
  return gb.toFixed(2) + " GB";
}
