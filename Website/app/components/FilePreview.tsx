import React, { useState } from "react";
import {
  FaFile,
  FaFileImage,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAudio,
  FaFileVideo,
  FaFileCode,
  FaFileArchive,
} from "react-icons/fa";

interface FilePreviewProps {
  file: {
    name: string;
    type: "file" | "folder";
    size: number;
    contentType?: string;
    url?: string;
    path?: string;
  };
  onClick?: () => void;
}

const getFileType = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const fileTypes: { [key: string]: string } = {
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    webp: "image",
    pdf: "pdf",
    doc: "word",
    docx: "word",
    txt: "text",
    rtf: "text",
    xls: "excel",
    xlsx: "excel",
    csv: "excel",
    js: "code",
    ts: "code",
    py: "code",
    html: "code",
    css: "code",
    json: "code",
    mp3: "audio",
    wav: "audio",
    ogg: "audio",
    mp4: "video",
    webm: "video",
    mov: "video",
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    tar: "archive",
    gz: "archive",
  };

  return fileTypes[extension] || "generic";
};

const FileIcon = ({
  type,
  className = "w-12 h-12",
}: {
  type: string;
  className?: string;
}) => {
  const icons: { [key: string]: React.ReactElement } = {
    folder: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ color: "#9CA3AF" }}
      >
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    image: <FaFileImage className={className} />,
    pdf: <FaFilePdf className={className} />,
    word: <FaFileWord className={className} />,
    excel: <FaFileExcel className={className} />,
    text: <FaFileAlt className={className} />,
    code: <FaFileCode className={className} />,
    audio: <FaFileAudio className={className} />,
    video: <FaFileVideo className={className} />,
    archive: <FaFileArchive className={className} />,
    generic: <FaFile className={className} />,
  };

  return icons[type] || icons.generic;
};

const FilePreview: React.FC<FilePreviewProps> = ({ file, onClick }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileType = getFileType(file.name);
  const [previewError, setPreviewError] = useState(false);

  const handlePreviewClick = () => {
    setIsPreviewOpen(true);
    if (onClick) onClick();
  };

  const handleDownloadZipClick = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/downloadFolderAsZip/${encodeURIComponent(
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
      a.download = `${file.name}.zip`; // Set the download filename
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download ZIP error:", error);
      alert("Failed to download ZIP. Please try again.");
    }
  };

  const PreviewContent = () => {
    if (file.type === "folder") {
      return (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <FileIcon type="folder" className="w-20 h-20" />
        </div>
      );
    }
    if (fileType === "image") {
      return (
        <div className="relative group">
          <img
            src={file.url || "/placeholder.png"}
            alt={file.name}
            className="w-full h-48 object-cover transition-all duration-300 filter group-hover:blur-none"
            style={{ backdropFilter: "blur(5px)" }}
            onError={() => setPreviewError(true)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100">
              Click to preview
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
        <FileIcon type={fileType} className="w-20 h-20 text-gray-400" />
      </div>
    );
  };

  return (
    <>
      <div
        className="cursor-pointer transition-all duration-300 hover:shadow-lg"
        onClick={handlePreviewClick}
      >
        <PreviewContent />
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[95vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{file.name}</h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="preview-content">
              {file.type === "folder" ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <FileIcon
                    type="folder"
                    className="w-32 h-32 text-gray-400 mb-4"
                  />
                  <p className="text-gray-600">
                    Folders cannot be previewed directly.
                  </p>
                  <button
                    onClick={handleDownloadZipClick}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Download as ZIP
                  </button>
                </div>
              ) : fileType === "image" && !previewError ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-[85vh] object-contain"
                />
              ) : fileType === "pdf" ? (
                <iframe
                  src={file.url}
                  className="w-full h-[85vh]"
                  title={file.name}
                />
              ) : fileType === "video" ? (
                <video controls className="w-full h-[85vh]">
                  <source src={file.url} type={file.contentType} />
                  Your browser does not support the video tag.
                </video>
              ) : fileType === "audio" ? (
                <audio controls className="w-full">
                  <source src={file.url} type={file.contentType} />
                  Your browser does not support the audio tag.
                </audio>
              ) : (
                <div className="flex flex-col items-center justify-center p-8">
                  <FileIcon
                    type={fileType}
                    className="w-32 h-32 text-gray-400 mb-4"
                  />
                  <p className="text-gray-600">Preview not available</p>
                  <a
                    href={file.url}
                    download
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilePreview;
