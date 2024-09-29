"use client";

import Layout from "../components/Layout"; // Use the Layout component
import { useState } from "react";
import { FaTimes } from "react-icons/fa"; // Importing the icon for the X button

const mockFiles = [
  { name: "Document 1.pdf", size: "1.2 MB", lastOpened: "2024-09-22" },
  { name: "Image 2.png", size: "3.4 MB", lastOpened: "2024-09-21" },
  { name: "Presentation.pptx", size: "5.8 MB", lastOpened: "2024-09-20" },
];

export default function FilesPage() {
  const [files, setFiles] = useState(mockFiles);
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    setEditMode((prev) => !prev);
  };

  const handleDeleteFile = (fileName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${fileName}"?`
    );
    if (confirmed) {
      // Filter out the file from the files list
      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.name !== fileName)
      );
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Files</h1>
        <div className="space-x-4">
          <button
            onClick={toggleEditMode}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
          >
            {editMode ? "Cancel" : "Edit"}
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Upload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {files.map((file, index) => (
          <div
            key={index}
            className="relative bg-white shadow-lg rounded-lg overflow-hidden"
          >
            {/* Image Placeholder */}
            <div className="h-3/4 bg-gray-200 flex justify-center items-center">
              <img
                src="/placeholder.png"
                alt="File Preview"
                className="object-cover w-full h-full"
              />
            </div>

            {/* File Information */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-800">{file.name}</h3>
              <p className="text-sm text-gray-600">
                Last Opened: {file.lastOpened}
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
            <div className="bg-gray-100">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
