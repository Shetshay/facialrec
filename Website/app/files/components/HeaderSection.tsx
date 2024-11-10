// /files/components/HeaderSection.tsx
import React from 'react';

interface HeaderSectionProps {
  user: { firstName: string } | null;
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNewFolderModal: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadModalType: React.Dispatch<React.SetStateAction<"files" | "folder" | null>>;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  user,
  editMode,
  setEditMode,
  setShowNewFolderModal,
  setUploadModalType,
}) => {
  return (
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
          onClick={() => setUploadModalType("files")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Upload Files
        </button>
        <button
          onClick={() => setUploadModalType("folder")}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Upload Folder
        </button>
      </div>
    </div>
  );
};

export default HeaderSection;
