"use client";

import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Image from "next/image";

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/listBucket", {
        method: "GET",
        credentials: "include", // Include cookies in the request
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure data.files is an array
        const filesArray = Array.isArray(data.files) ? data.files : [];
        setFiles(filesArray);
      } else {
        console.error("Failed to fetch files:", response.statusText);
        setFiles([]); // Set files to empty array on error
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]); // Set files to empty array on error
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
          // Remove the file from the state
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
    // Redirect the browser to the download URL
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
    // Append each selected file to the form data
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
        // Refresh the file list
        fetchFiles();
        // Close the modal
        handleUploadClose();
      } else {
        console.error("Failed to upload files:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white-800">Files</h1>
        <div className="space-x-4">
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

      {files.length === 0 ? (
        <div className="text-center mt-8">
          <h2 className="text-xl text-gray-600">
            You haven't uploaded anything yet.
          </h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative bg-white shadow-lg rounded-lg flex flex-col h-full"
            >
              {/* Image Placeholder */}
              <div className="h-48 bg-gray-200 flex justify-center items-center">
                <Image
                  src="/placeholder.png"
                  alt="File Preview"
                  className="object-cover w-full h-full"
                  width={500}
                  height={500}
                />
              </div>

              {/* File Information */}
              <div className="p-4 flex-grow">
                <h3 className="text-lg font-bold text-gray-800">{file.name}</h3>
                <p className="text-sm text-gray-600">
                  Last Modified: {new Date(file.lastModified).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Size: {formatFileSize(file.size)}
                </p>
              </div>

              {/* X Icon in Edit Mode */}
              {editMode && (
                <div className="absolute top-2 left-2">
                  <button
                    onClick={() => handleDeleteFile(file.name)}
                    className="bg-white border-2 border-gray-800 rounded-full p-1"
                  >
                    <FaTimes className="text-gray-800" />
                  </button>
                </div>
              )}

              {/* Download Button */}
              <div className="bg-gray-100 p-4">
                <button
                  onClick={() => handleDownloadFile(file.name)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
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
  );
}

// Helper function to format file size
interface File {
  name: string;
  lastModified: string;
  size: number;
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
