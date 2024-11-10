// FilesGrid.tsx
import React from 'react';
import FilePreview from "../../components/FilePreview";
import { FaFileDownload, FaFolderOpen, FaFolder, FaTimes } from "react-icons/fa";

interface FileObject {
  url: string;
  name: string;
  lastModified: string;
  size: number;
  type: "file" | "folder";
  path?: string;
  contentType?: string;
}

interface FilesGridProps {
  files: FileObject[];
  editMode: boolean;
  handleNavigateToFolder: (folderPath: string) => void;
  handleDeleteItem: (name: string, type: "file" | "folder") => void;
  handleDownloadFolderAsZip: (folderPath: string) => void;
  setItemToMove: React.Dispatch<React.SetStateAction<any>>;
  setShowMoveModal: React.Dispatch<React.SetStateAction<boolean>>;
  fetchFolderStructure: () => Promise<void>;
  currentPath: string;
}

const FilesGrid: React.FC<FilesGridProps> = ({
  files,
  editMode,
  handleNavigateToFolder,
  handleDeleteItem,
  handleDownloadFolderAsZip,
  setItemToMove,
  setShowMoveModal,
  fetchFolderStructure,
  currentPath,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    let kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(2) + " KB";
    let mb = kb / 1024;
    if (mb < 1024) return mb.toFixed(2) + " MB";
    let gb = mb / 1024;
    return gb.toFixed(2) + " GB";
  };

  return files.length === 0 ? (
    <div className="text-center mt-8">
      <h2 className="text-xl text-gray-600">This folder is empty</h2>
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <div
          key={index}
          className="relative bg-white shadow-lg rounded-lg flex flex-col min-h-[300px] max-w-full overflow-hidden"
        >
          <div className="relative flex-shrink-0">
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
            
            {/* Edit Mode Delete Button */}
            {editMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(file.name, file.type);
                }}
                className="absolute top-2 right-2 bg-white border-2 border-red-500 rounded-full p-1 hover:bg-red-50 shadow-md"
              >
                <FaTimes className="text-red-500" />
              </button>
            )}
          </div>

          <div className="p-3 flex-grow overflow-auto">
            <h3 className="text-base font-bold text-gray-800 break-words truncate">
              {file.name}
            </h3>
            {file.path && (
              <p className="text-xs text-gray-500 mt-1 break-words truncate">
                Path: {file.path}
              </p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Last Modified: {new Date(file.lastModified).toLocaleString()}
            </p>
            {file.type !== "folder" && (
              <p className="text-xs text-black mt-1">
                Size: {formatFileSize(file.size)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-2 bg-gray-50 border-t flex flex-wrap gap-2">
            {file.type !== "folder" ? (
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

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (error) {
                    console.error("Download error:", error);
                    alert("Failed to download file. Please try again.");
                  }
                }}
                className="flex-1 min-w-[120px] px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <FaFileDownload className="mr-1" />
                Download
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadFolderAsZip(file.path || file.name);
                }}
                className="flex-1 min-w-[120px] px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              >
                <FaFileDownload className="mr-1" />
                Download ZIP
              </button>
            )}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                setItemToMove({
                  name: file.name,
                  type: file.type,
                  path: file.path || file.name,
                });
                setShowMoveModal(true);
                await fetchFolderStructure();
              }}
              className="flex-1 min-w-[80px] px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
            >
              Move
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilesGrid;
