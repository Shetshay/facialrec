// components/FileIconUtils.tsx
import React from "react";
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
  FaFolder,
} from "react-icons/fa";

export const fileTypes: { [key: string]: string } = {
  // Images
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  // Documents
  pdf: "pdf",
  doc: "word",
  docx: "word",
  txt: "text",
  rtf: "text",
  // Spreadsheets
  xls: "excel",
  xlsx: "excel",
  csv: "excel",
  // Code
  js: "code",
  ts: "code",
  py: "code",
  html: "code",
  css: "code",
  json: "code",
  // Audio
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  // Video
  mp4: "video",
  webm: "video",
  mov: "video",
  // Archives
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
};

export const getFileType = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  return fileTypes[extension] || "generic";
};

export const FileIconComponent = ({
  type,
  className = "w-12 h-12",
}: {
  type: string;
  className?: string;
}) => {
  const icons: { [key: string]: React.ReactElement } = {
    folder: <FaFolder className={className} />,
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