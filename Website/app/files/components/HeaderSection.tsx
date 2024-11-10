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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-6 w-full">
      <div className="w-full md:w-auto">
        <h1 className="text-2xl font-bold text-white-800">Files</h1>
        {user && <p className="">Welcome, {user.firstName}!</p>}
      </div>
      
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        <button
          onClick={() => setShowNewFolderModal(true)}
          className="flex-1 md:flex-none px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-600 whitespace-nowrap min-w-[120px]"
        >
          New Folder
        </button>
        
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex-1 md:flex-none px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 whitespace-nowrap min-w-[100px]"
        >
          {editMode ? "Cancel" : "Edit"}
        </button>
        
        <button
          onClick={() => setUploadModalType("folder")} // Changed from "files" to "folder"
          className="flex-1 md:flex-none px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 whitespace-nowrap min-w-[120px]"
        >
          Upload Folder
        </button>
        
        <button
          onClick={() => setUploadModalType("files")} // Changed from "folder" to "files"
          className="flex-1 md:flex-none px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 whitespace-nowrap min-w-[120px]"
        >
          Upload File
        </button>
      </div>
    </div>
  );
};

export default HeaderSection;
