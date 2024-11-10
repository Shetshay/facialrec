// /files/components/Modals/UploadConfirmationModal.tsx
import React from 'react';

interface UploadConfirmationModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fileCount: number;
}

const UploadConfirmationModal: React.FC<UploadConfirmationModalProps> = ({
  show,
  onConfirm,
  onCancel,
  fileCount,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Confirm Upload</h2>
        <p className="text-gray-600 mb-4">
          You are about to upload <strong>{fileCount}</strong> files. Are you sure you want to proceed?
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadConfirmationModal;
