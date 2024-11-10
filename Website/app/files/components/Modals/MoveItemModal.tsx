// /files/components/Modals/MoveItemModal.tsx
import React from 'react';
import { FaFolderOpen, FaFolder } from "react-icons/fa";
import { FolderNode } from "../../utils/types";

interface MoveItemModalProps {
  showMoveModal: boolean;
  itemToMove: {
    name: string;
    type: string;
    path: string;
  } | null;
  onCancel: () => void;
  onMove: () => void;
  folderStructure: FolderNode | null;
  selectedFolder: string;
  setSelectedFolder: React.Dispatch<React.SetStateAction<string>>;
  renderFolderTree: (node: FolderNode) => JSX.Element;
}

const MoveItemModal: React.FC<MoveItemModalProps> = ({
  showMoveModal,
  itemToMove,
  onCancel,
  onMove,
  folderStructure,
  selectedFolder,
  setSelectedFolder,
  renderFolderTree,
}) => {
  if (!showMoveModal || !itemToMove) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Move {itemToMove.type === "folder" ? "Folder" : "File"}
        </h2>
        <p className="text-gray-600 mb-4">
          Select the destination folder to move "{itemToMove.name}" to.
        </p>
        <div className="border p-2 rounded mb-4">
          <div
            className={`flex items-center cursor-pointer ${
              selectedFolder === "" ? "text-blue-500" : ""
            }`}
            onClick={() => setSelectedFolder("")}
          >
            <FaFolderOpen />
            <span className="ml-2">Root</span>
          </div>
          {folderStructure && renderFolderTree(folderStructure)}
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onMove}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            disabled={!itemToMove || selectedFolder === null}
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveItemModal;
