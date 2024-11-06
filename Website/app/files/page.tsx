"use client";

import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { FaTimes, FaFolder, FaFolderOpen, FaFile, FaArrowLeft } from "react-icons/fa";import Image from "next/image";
import { useAuth } from '../Context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');


  useEffect(() => {
    if (!isLoading && !initialized) {
      setInitialized(true);
      console.log('Files Page mounted - User:', user);
      fetchFiles();
    }
  }, [isLoading, initialized]);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/listBucket?path=${encodeURIComponent(currentPath)}`, {
        method: "GET",
        credentials: "include",
      });
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

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  const handleDeleteFile = async (fileName: string): Promise<void> => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}"?`
    );
    if (confirmed) {
      try {
        const response = await fetch("http://localhost:3000/api/deleteFile", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileName }),
        });
        if (response.ok) {
          setFiles((prevFiles) =>
            prevFiles.filter((file) => file.name !== fileName)
          );
        } else {
          console.error("Failed to delete file:", response.statusText);
        }
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }
  };

  const handleDownloadFile = (fileName: string): void => {
    window.location.href = `http://localhost:3000/api/downloadFile/${encodeURIComponent(
      fileName
    )}`;
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleUploadClose = () => {
    setShowUploadModal(false);
    setSelectedFiles(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert("Please select at least one file to upload.");
      return;
    }

    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("http://localhost:3000/api/uploadFile", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Files uploaded successfully:", data.uploaded_files);
        fetchFiles();
        handleUploadClose();
      } else {
        console.error("Failed to upload files:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  //newest  handlers for folders
  const handleNavigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
    fetchFiles();
  };
  
  const handleNavigateBack = () => {
    const newPath = currentPath.split('/').slice(0, -1).join('/');
    setCurrentPath(newPath);
    fetchFiles();
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
        setNewFolderName('');
      } else {
        console.error("Failed to create folder");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };


return (
    <ProtectedRoute>
      <Layout>
        <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Files</h1>
          {user && (
            <p className="userName">Welcome, {user.firstName}!</p>
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
              onClick={toggleEditMode}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              {editMode ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={handleUploadClick}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Upload
            </button>
          </div>
        </div>

        {/* Back button and current path display */}
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

        {files.length === 0 ? (
          <div className="text-center mt-8">
            <h2 className="text-xl text-gray-600">
              This folder is empty
            </h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative bg-white shadow-lg rounded-lg flex flex-col h-full cursor-pointer"
                onClick={() => file.type === 'folder' && handleNavigateToFolder(`${currentPath}/${file.name}`)}
              >
                <div className="h-48 bg-gray-200 flex justify-center items-center">
                  {file.type === 'folder' ? (
                    <FaFolder className="w-24 h-24 text-blue-400" />
                  ) : (
                    <Image
                      src="/placeholder.png"
                      alt="File Preview"
                      className="object-cover w-full h-full"
                      width={500}
                      height={500}
                    />
                  )}
                </div>

                <div className="p-4 flex-grow bg-white">
                <h3 className="text-xl font-bold text-black mb-2 text-center">
                  {file.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Last Modified: {new Date(file.lastModified).toLocaleString()}
                </p>
                {file.type !== 'folder' && (
                  <p className="text-sm text-gray-600">
                    Size: {formatFileSize(file.size)}
                  </p>
                )}
              </div>

                {editMode && (
                  <div className="absolute top-2 left-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.name);
                      }}
                      className="bg-white border-2 border-gray-800 rounded-full p-1"
                    >
                      <FaTimes className="text-gray-800" />
                    </button>
                  </div>
                )}

                {file.type !== 'folder' && (
                  <div className="bg-gray-100 p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadFile(file.name);
                      }}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

       {/* New Folder Modal */}
{showNewFolderModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">Create New Folder</h2>
      <input
        type="text"
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        placeholder="Folder name"
        className="folderModalInput"
        autoFocus
      />
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => {
            setShowNewFolderModal(false);
            setNewFolderName('');
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

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Upload Files</h2>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mb-4"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleUploadClose}
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

interface File {
  name: string;
  lastModified: string;
  size: number;
  type: 'file' | 'folder';  
  path: string;            
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