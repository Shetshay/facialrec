// app/files/page.tsx
"use client";

import Layout from "../components/Layout"; // Use the Layout component
import { useState } from "react";
import BackToHomeButton from "../components/BackToHomeButton"; // Optional button to navigate back

const mockFiles = [
  { name: "Document 1.pdf", size: "1.2 MB", uploaded: "2024-09-01" },
  { name: "Image 2.png", size: "3.4 MB", uploaded: "2024-09-12" },
  { name: "Presentation.pptx", size: "5.8 MB", uploaded: "2024-09-18" },
];

export default function FilesPage() {
  const [files] = useState(mockFiles);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Files</h1>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
        <ul className="space-y-4">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex justify-between items-center bg-gray-100 p-4 rounded-lg"
            >
              <div>
                <h3 className="text-gray-600 font-semibold">{file.name}</h3>
                <p className="text-gray-600">
                  Size: {file.size} | Uploaded: {file.uploaded}
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Download
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
