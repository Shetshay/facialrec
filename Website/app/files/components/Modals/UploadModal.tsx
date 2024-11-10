// /files/components/Modals/UploadModal.tsx
import React from 'react';

interface UploadModalProps {
  uploadModalType: "files" | "folder" | null;
  setUploadModalType: React.Dispatch<React.SetStateAction<"files" | "folder" | null>>;
  selectedFiles: FileList | null;
  setSelectedFiles: React.Dispatch<React.SetStateAction<FileList | null>>;
  uploadProgress: number | null;
  uploadFolderName: string;
  setUploadFolderName: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  setUploadProgress: React.Dispatch<React.SetStateAction<number | null>>;
}

const UploadModal: React.FC<UploadModalProps> = ({
  uploadModalType,
  setUploadModalType,
  selectedFiles,
  setSelectedFiles,
  uploadProgress,
  uploadFolderName,
  setUploadFolderName,
  onSubmit,
  setUploadProgress,
}) => {
  if (!uploadModalType) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          {uploadModalType === "files" ? "Upload Files" : "Upload Folder"}
        </h2>

        {uploadModalType === "files" && (
          <input
            type="text"
            value={uploadFolderName}
            onChange={(e) => setUploadFolderName(e.target.value)}
            placeholder="Folder name (optional)"
            className="w-full p-2 border rounded mb-4 bg-white text-black ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        )}

        <input
          type="file"
          multiple
          onChange={(e) => setSelectedFiles(e.target.files)}
          className="mb-4"
          {...(uploadModalType === "folder"
            ? ({ directory: "", webkitdirectory: "" } as any)
            : {})}
        />

        {uploadProgress !== null && (
          <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
            <div
              className="bg-blue-500 h-6 rounded-full text-center text-white flex items-center justify-center"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => {
              setUploadModalType(null);
              setSelectedFiles(null);
              setUploadProgress(null);
              setUploadFolderName("");
            }}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={uploadProgress !== null}
          >
            {uploadProgress !== null ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
