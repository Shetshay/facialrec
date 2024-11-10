// /files/components/Modals/DeleteConfirmationModal.tsx
import React from 'react';

interface DeleteConfirmationModalProps {
  showDeleteModal: boolean;
  itemToDelete: {
    name: string;
    type: string;
    count?: number;
  } | null;
  onCancel: () => void;
  onConfirm: () => void;
  currentPath: string;
  performDelete: (path: string, type: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  showDeleteModal,
  itemToDelete,
  onCancel,
  onConfirm,
  currentPath,
  performDelete,
}) => {
  if (!showDeleteModal || !itemToDelete) return null;

  return (
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
            onClick={onCancel}
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
  );
};

export default DeleteConfirmationModal;
