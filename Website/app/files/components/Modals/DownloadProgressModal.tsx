// /files/components/Modals/DownloadProgressModal.tsx
import React from 'react';

interface DownloadProgressModalProps {
  downloadProgress: number | null;
  setDownloadProgress: React.Dispatch<React.SetStateAction<number | null>>;
}

const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  downloadProgress,
  setDownloadProgress,
}) => {
  if (downloadProgress === null) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Downloading ZIP</h2>
        <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
          <div
            className="bg-green-500 h-6 rounded-full text-center text-white flex items-center justify-center"
            style={{ width: `${downloadProgress}%` }}
          >
            {downloadProgress}%
          </div>
        </div>
        <button
          onClick={() => setDownloadProgress(null)}
          className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DownloadProgressModal;
