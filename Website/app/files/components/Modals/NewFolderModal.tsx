// /files/components/Modals/NewFolderModal.tsx
import React from 'react';

interface NewFolderModalProps {
  showNewFolderModal: boolean;
  newFolderName: string;
  setNewFolderName: React.Dispatch<React.SetStateAction<string>>;
  onCancel: () => void;
  onCreate: () => void;
}

const NewFolderModal: React.FC<NewFolderModalProps> = ({
  showNewFolderModal,
  newFolderName,
  setNewFolderName,
  onCancel,
  onCreate,
}) => {
  if (!showNewFolderModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black">Create New Folder</h2>
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Folder name"
          className="w-full p-2 border rounded mb-4 bg-white text-black ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewFolderModal;
