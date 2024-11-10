// /files/components/SearchFilterSection.tsx
import React from 'react';
import { FaSearch } from "react-icons/fa";

interface SearchFilterSectionProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  fileTypeFilter: string;
  setFileTypeFilter: React.Dispatch<React.SetStateAction<string>>;
}

const SearchFilterSection: React.FC<SearchFilterSectionProps> = ({
  searchQuery,
  setSearchQuery,
  fileTypeFilter,
  setFileTypeFilter,
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      <select
        value={fileTypeFilter}
        onChange={(e) => setFileTypeFilter(e.target.value)}
        className="px-4 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-500"
      >
        <option value="all">All Files</option>
        <option value="images">Images</option>
        <option value="documents">Documents</option>
        <option value="spreadsheets">Spreadsheets</option>
        <option value="presentations">Presentations</option>
        <option value="audio">Audio</option>
        <option value="video">Video</option>
        <option value="archives">Archives</option>
        <option value="code">Code Files</option>
        <option value="folders">Folders</option>
      </select>
    </div>
  );
};

export default SearchFilterSection;
