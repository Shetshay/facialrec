// files/page.tsx
"use client";

import Layout from "../components/Layout";
import { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

// Import your new components
import HeaderSection from "./components/HeaderSection";
import SearchFilterSection from "./components/SearchFilterSection";
import NavigationBar from "./components/NavigationBar";
import FilesGrid from "./components/FilesGrid";
import DeleteConfirmationModal from "./components/Modals/DeleteConfirmationModal";
import NewFolderModal from "./components/Modals/NewFolderModal";
import UploadModal from "./components/Modals/UploadModal";
import DownloadProgressModal from "./components/Modals/DownloadProgressModal";
import MoveItemModal from "./components/Modals/MoveItemModal";
import UploadConfirmationModal from "./components/Modals/UploadConfirmationModal"; // Imported the UploadConfirmationModal

// Import utility functions and interfaces
import { FileObject, FolderNode } from "./utils/types"; // Ensure 'types.ts' exists in 'utils' directory
import { formatFileSize } from "./utils/helpers"; // Ensure 'helpers.ts' exists in 'utils' directory

// Import necessary icons
import { FaFolderOpen, FaFolder } from "react-icons/fa";

export default function FilesPage() {
  // State variables
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [files, setFiles] = useState<FileObject[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [uploadModalType, setUploadModalType] = useState<"files" | "folder" | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadFolderName, setUploadFolderName] = useState("");
  const [initialized, setInitialized] = useState(false);
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>("");
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [filteredFiles, setFilteredFiles] = useState<FileObject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    name: string;
    type: string;
    count?: number;
  } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [showUploadConfirmation, setShowUploadConfirmation] = useState<boolean>(false); // Added state for upload confirmation

  // State variables for moving items
  const [itemToMove, setItemToMove] = useState<{
    name: string;
    type: string;
    path: string;
  } | null>(null);
  const [folderStructure, setFolderStructure] = useState<FolderNode | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  // Effect hooks
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
  }, [searchQuery, fileTypeFilter, files, currentPath]);

  // Functions
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
        setFilteredFiles(filesArray);
      } else {
        console.error("Failed to fetch files:", response.statusText);
        setFiles([]);
        setFilteredFiles([]);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]);
      setFilteredFiles([]);
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

  // Updated handleUploadSubmit function
  const handleUploadSubmit = async (confirmed: boolean = false) => {
    if (!selectedFiles?.length) {
      alert("Please select at least one file to upload.");
      return;
    }

    // Check if the number of files exceeds 15 and confirmation hasn't been shown
    if (selectedFiles.length > 15 && !confirmed) {
      setShowUploadConfirmation(true);
      return;
    }

    // Proceed with the upload
    const formData = new FormData();

    let basePath = currentPath;
    if (uploadModalType === "files" && uploadFolderName.trim()) {
      basePath = basePath
        ? `${basePath}/${uploadFolderName.trim()}`
        : uploadFolderName.trim();
    }

    Array.from(selectedFiles).forEach((file) => {
      const relativePath =
        uploadModalType === "folder"
          ? (file as any).webkitRelativePath || file.name
          : file.name;

      const fullPath = relativePath;

      formData.append("files", file, fullPath);
    });
    formData.append("path", basePath);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:3000/api/uploadFile", true);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          await fetchFiles();
          setUploadModalType(null);
          setSelectedFiles(null);
          setUploadProgress(null);
          setUploadFolderName("");
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

  const handleDownloadFolderAsZip = async (folderPath: string) => {
    const encodedPath = encodeURIComponent(folderPath);
    const downloadUrl = `http://localhost:3000/api/downloadFolderAsZip/${encodedPath}`;

    try {
      setDownloadProgress(0);
      const response = await fetch(downloadUrl, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Download failed");

      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      const stream = new ReadableStream({
        start(controller) {
          const pump = () => {
            reader?.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              loaded += value.length;
              if (total) {
                const percent = Math.round((loaded / total) * 100);
                setDownloadProgress(percent);
              }
              controller.enqueue(value);
              pump();
            });
          };
          pump();
        },
      });

      const blob = await new Response(stream).blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderPath}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDownloadProgress(null);
    } catch (error) {
      console.error("Error downloading folder as ZIP:", error);
      alert("Failed to download folder as ZIP. Please try again.");
      setDownloadProgress(null);
    }
  };

  const handleMoveItem = async () => {
    if (!itemToMove) return;

    try {
      const response = await fetch("http://localhost:3000/api/moveFile", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourcePath: itemToMove.path,
          destinationPath: selectedFolder,
          type: itemToMove.type,
        }),
      });

      if (response.ok) {
        await fetchFiles();
        setShowMoveModal(false);
        setItemToMove(null);
        setSelectedFolder("");
        setFolderStructure(null);
      } else {
        const data = await response.json();
        alert(`Failed to move item: ${data.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error moving item:", error);
      alert("Failed to move item. Please try again.");
    }
  };

  const fetchFolderStructure = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/listBucket`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const rootNode: FolderNode = {
          name: "",
          path: "",
          children: [],
        };
        await buildFolderTree(rootNode, "");
        setFolderStructure(rootNode);
      }
    } catch (error) {
      console.error("Error fetching folder structure:", error);
    }
  };

  const buildFolderTree = async (node: FolderNode, path: string) => {
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

      for (const file of filesArray) {
        if (file.type === "folder") {
          const childNode: FolderNode = {
            name: file.name,
            path: path ? `${path}/${file.name}` : file.name,
            children: [],
          };
          node.children.push(childNode);
          await buildFolderTree(childNode, childNode.path);
        }
      }
    }
  };

  const renderFolderTree = (node: FolderNode) => {
    return (
      <ul className="ml-4">
        {node.children.map((child: FolderNode) => (
          <li key={child.path}>
            <div
              className={`flex items-center cursor-pointer ${
                selectedFolder === child.path ? "text-blue-500" : ""
              }`}
              onClick={() => setSelectedFolder(child.path)}
            >
              {child.children.length > 0 ? <FaFolderOpen /> : <FaFolder />}
              <span className="ml-2">{child.name}</span>
            </div>
            {child.children.length > 0 && renderFolderTree(child)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <ProtectedRoute>
      <Layout>
        {/* Header Section */}
        <HeaderSection
          user={user}
          editMode={editMode}
          setEditMode={setEditMode}
          setShowNewFolderModal={setShowNewFolderModal}
          setUploadModalType={setUploadModalType}
        />

        {/* Search and Filter Section */}
        <SearchFilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          fileTypeFilter={fileTypeFilter}
          setFileTypeFilter={setFileTypeFilter}
        />

        {/* Navigation Bar */}
        <NavigationBar
          currentPath={currentPath}
          handleNavigateBack={handleNavigateBack}
        />

        {/* Files Grid */}
        <FilesGrid
          files={filteredFiles}
          editMode={editMode}
          handleNavigateToFolder={handleNavigateToFolder}
          handleDeleteItem={handleDeleteItem}
          handleDownloadFolderAsZip={handleDownloadFolderAsZip}
          setItemToMove={setItemToMove}
          setShowMoveModal={setShowMoveModal}
          fetchFolderStructure={fetchFolderStructure}
          currentPath={currentPath}
        />

        {/* Modals */}
        <DeleteConfirmationModal
          showDeleteModal={showDeleteModal}
          itemToDelete={itemToDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={() => {
            const fullPath = currentPath
              ? `${currentPath}/${itemToDelete!.name}`
              : itemToDelete!.name;
            performDelete(fullPath, itemToDelete!.type);
          }}
          currentPath={currentPath}
          performDelete={performDelete}
        />

        <NewFolderModal
          showNewFolderModal={showNewFolderModal}
          newFolderName={newFolderName}
          setNewFolderName={setNewFolderName}
          onCancel={() => {
            setShowNewFolderModal(false);
            setNewFolderName("");
          }}
          onCreate={handleCreateFolder}
        />

        <UploadModal
          uploadModalType={uploadModalType}
          setUploadModalType={setUploadModalType}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          uploadProgress={uploadProgress}
          uploadFolderName={uploadFolderName}
          setUploadFolderName={setUploadFolderName}
          onSubmit={handleUploadSubmit}
          setUploadProgress={setUploadProgress}
        />

        <DownloadProgressModal
          downloadProgress={downloadProgress}
          setDownloadProgress={setDownloadProgress}
        />

        <MoveItemModal
          showMoveModal={showMoveModal}
          itemToMove={itemToMove}
          onCancel={() => {
            setShowMoveModal(false);
            setItemToMove(null);
            setSelectedFolder("");
            setFolderStructure(null);
          }}
          onMove={handleMoveItem}
          folderStructure={folderStructure}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          renderFolderTree={renderFolderTree}
        />

        {/* Upload Confirmation Modal */}
        <UploadConfirmationModal
          show={showUploadConfirmation}
          onConfirm={async () => {
            setShowUploadConfirmation(false);
            // Proceed with the upload
            await handleUploadSubmit(true);
          }}
          onCancel={() => {
            setShowUploadConfirmation(false);
            // Optionally reset the upload modal if desired
            // setUploadModalType(null);
            // setSelectedFiles(null);
          }}
          fileCount={selectedFiles ? selectedFiles.length : 0}
        />
      </Layout>
    </ProtectedRoute>
  );
}
