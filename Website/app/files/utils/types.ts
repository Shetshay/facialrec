// /files/utils/types.ts
export interface FileObject {
    url: string;
    name: string;
    lastModified: string;
    size: number;
    type: "file" | "folder";
    path?: string;
    contentType?: string;
  }
  
  export interface FolderNode {
    name: string;
    path: string;
    children: FolderNode[];
  }
  