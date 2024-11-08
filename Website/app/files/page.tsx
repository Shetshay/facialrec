"use client";

import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { FaTimes, FaArrowLeft, FaSearch } from "react-icons/fa";
import FilePreview from "../components/FilePreview";
import { useAuth } from "../Context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export default function FilesPage() {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // New state to store upload progress
  const [files, setFiles] = useState<FileObject[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>("");
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [filteredFiles, setFilteredFiles] = useState<FileObject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  // Add these with your other state declarations
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    name: string;
    type: string;
    count?: number;
  } | null>(null);

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

  useEffect(() => {
    const searchFilesRecursively = async () => {
      if (!searchQuery.trim() && fileTypeFilter === "all") {
        setFilteredFiles(files);
        return;
      }

      try {
        const allFiles: FileObject[] = [];

        const getAllFiles = async (path: string) => {
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

            const filesWithPath = filesArray.map((file: { name: any }) => ({
              ...file,
              path: path ? `${path}/${file.name}` : file.name,
            }));

            allFiles.push(...filesWithPath);

            for (const file of filesArray) {
              if (file.type === "folder") {
                const folderPath = path ? `${path}/${file.name}` : file.name;
                await getAllFiles(folderPath);
              }
            }
          }
        };

        await getAllFiles(currentPath);

        // Filter by search query and file type
        const query = searchQuery.toLowerCase();
        let filtered = allFiles;

        // Apply search filter if query exists
        if (searchQuery.trim()) {
          filtered = filtered.filter((file) =>
            file.name.toLowerCase().includes(query)
          );
        }

        // Apply file type filter
        if (fileTypeFilter !== "all") {
          filtered = filtered.filter((file) => {
            const extension = file.name.split(".").pop()?.toLowerCase() || "";
            switch (fileTypeFilter) {
              case "images":
                return ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(
                  extension
                );
              case "documents":
                return ["pdf", "doc", "docx", "txt", "rtf", "odt"].includes(
                  extension
                );
              case "spreadsheets":
                return ["xls", "xlsx", "csv", "ods"].includes(extension);
              case "presentations":
                return ["ppt", "pptx", "odp"].includes(extension);
              case "audio":
                return ["mp3", "wav", "ogg", "m4a", "flac"].includes(extension);
              case "video":
                return ["mp4", "avi", "mov", "wmv", "flv", "mkv"].includes(
                  extension
                );
              case "archives":
                return ["zip", "rar", "7z", "tar", "gz"].includes(extension);
              case "code":
                return [
                  "js",
                  "ts",
                  "py",
                  "java",
                  "cpp",
                  "html",
                  "css",
                  "php",
                ].includes(extension);
              case "folders":
                return file.type === "folder";
              default:
                return true;
            }
          });
        }

        setFilteredFiles(filtered);
      } catch (error) {
        console.error("Error searching files:", error);
        setFilteredFiles([]);
      }
    };

    searchFilesRecursively();
  }, [searchQuery, fileTypeFilter]);

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
        setFilteredFiles(filesArray); // Add this line
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
        setItemToDelete({ name, type, count: data.count });
        setShowDeleteModal(true);
      } else {
        // If it's a single file, delete directly
        await performDelete(fullPath, type);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  // Add this new function to handle the actual deletion
  const performDelete = async (path: string, type: string) => {
    try {
      const deleteResponse = await fetch(
        "http://localhost:3000/api/deleteFile?confirmed=true",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path,
            type,
          }),
        }
      );

      if (!deleteResponse.ok) throw new Error("Failed to delete item");
      await fetchFiles();
      setShowDeleteModal(false);
      setItemToDelete(null);
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
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:3000/api/uploadFile", true);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(percentComplete); // Update the state with the current progress
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          await fetchFiles();
          setShowUploadModal(false);
          setSelectedFiles(null);
          setUploadProgress(null); // Reset progress after completion
        } else {
          alert("Upload failed");
          setUploadProgress(null);
        }
      };

      xhr.onerror = () => {
        alert("Failed to upload files. Please try again.");
        setUploadProgress(null);
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files. Please try again.");
      setUploadProgress(null);
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
            <h1 className="text-2xl font-bold text-white-800">Files</h1>
            {user && <p className="text-white">Welcome, {user.firstName}!</p>}
          </div>
          <div className="space-x-4">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600"
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

        {/* Search and Filter Section */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
            <option value="spreadsheets">Spreadsheets</option>
            <option value="presentations">Presentations</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="archives">Archives</option>
            <option value="code">Code Files</option>
            <option value="folders">Folders</option>
          </select>
        </div>

        {/* Navigation Bar */}
        {currentPath && (
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={handleNavigateBack}
              className="p-2 hover:bg-gray-700 rounded-full"
            >
              <FaArrowLeft className="text-white" />
            </button>
            <span className="text-white">Current path: {currentPath}</span>
          </div>
        )}

        {/* Files Grid */}
        {filteredFiles.length === 0 ? (
          <div className="text-center mt-8">
            <h2 className="text-xl text-gray-600">This folder is empty</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredFiles.map((file, index) => (
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
                    file.type === "folder" &&
                    handleNavigateToFolder(file.path || file.name)
                  }
                />

                <div className="p-4 flex-grow">
                  <h3 className="text-lg font-bold text-gray-800 break-words">
                    {file.name}
                  </h3>
                  {searchQuery && file.path && (
                    <p className="text-sm text-gray-500 mt-1">
                      Path: {file.path}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Last Modified:{" "}
                    {new Date(file.lastModified).toLocaleString()}
                  </p>
                  {file.type !== "folder" && (
                    <p className="text-sm text-black">
                      Size: {formatFileSize(file.size)}
                    </p>
                  )}
                </div>
                {/* Download Button */}
                {file.type !== "folder" && (
                  <div className="p-4 bg-gray-50 border-t">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const response = await fetch(
                            `http://localhost:3000/api/downloadFile/${encodeURIComponent(
                              file.path || file.name
                            )}`,
                            {
                              method: "GET",
                              credentials: "include",
                            }
                          );

                          if (!response.ok) throw new Error("Download failed");

                          // Get the blob from the response
                          const blob = await response.blob();

                          // Create a URL for the blob
                          const url = window.URL.createObjectURL(blob);

                          // Create a temporary anchor element
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = file.name; // Set the download filename
                          document.body.appendChild(a);

                          // Trigger the download
                          a.click();

                          // Clean up
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (error) {
                          console.error("Download error:", error);
                          alert("Failed to download file. Please try again.");
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                )}

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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
              <div className="mb-6">
                {itemToDelete.type === "folder" ? (
                  <p className="text-gray-600">
                    This folder "{itemToDelete.name}" contains{" "}
                    {itemToDelete.count} item(s). Are you sure you want to
                    delete the folder and all its contents?
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Are you sure you want to delete "{itemToDelete.name}"?
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const fullPath = currentPath
                      ? `${currentPath}/${itemToDelete.name}`
                      : itemToDelete.name;
                    performDelete(fullPath, itemToDelete.type);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
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
                className="w-full p-2 border rounded mb-4 bg-white text-black ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
                style={{ color: "black" }}
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

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-xl font-bold mb-4">Upload Files</h2>
              <input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="mb-4"
              />

              {uploadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
                  <div
                    className="bg-blue-500 h-6 rounded-full text-center text-white"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles(null);
                    setUploadProgress(null); // Reset progress when cancelled
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  disabled={uploadProgress !== null} // Disable button when uploading
                >
                  {uploadProgress !== null ? "Uploading..." : "Upload"}
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
  url: string;
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
