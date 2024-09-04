"use client"; // Ensure this is at the top of the file

import Image from "next/image";

export default function Home() {
  // Define the handleClick function
  const handleClick = (name: string) => {
    alert(`${name} clicked!`);
  }; // Make sure this closing bracket is present

  // Now the return statement
  return (
    <div className="flex h-full bg-black">
      {/* Sidebar Navigation */}
      <nav className="flex flex-col w-[14%] text-black p-5 bg-black">
        <div
          className="bg-white py-3 px-4 mb-3 rounded-lg cursor-pointer text-center"
          onClick={() => handleClick("My Files")}
        >
          My Files
        </div>
        <div
          className="bg-white py-3 px-4 mb-3 rounded-lg cursor-pointer text-center"
          onClick={() => handleClick("Shared")}
        >
          Shared
        </div>
        <div
          className="bg-white py-3 px-4 mb-3 rounded-lg cursor-pointer text-center"
          onClick={() => handleClick("Upload")}
        >
          Upload
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 bg-black">
        <header className="bg-black p-4 flex justify-between items-center relative">
          <h1 className="text-white text-center">Facial Rec</h1>
        </header>

        {/* Main Section with File Icons */}
        <main className="flex gap-10 p-5 flex-wrap bg-black">
          <div
            className="fileBox cursor-pointer"
            onClick={() => handleClick("myfile")}
          >
            <Image src="/file.png" alt="File Icon" width={60} height={60} />
            <p className="text-white">myfile</p>
          </div>
          <div
            className="fileBox cursor-pointer"
            onClick={() => handleClick("cactus")}
          >
            <Image src="/file.png" alt="File Icon" width={60} height={60} />
            <p className="text-white">cactus</p>
          </div>
          <div
            className="fileBox cursor-pointer"
            onClick={() => handleClick("guest")}
          >
            <Image src="/file.png" alt="File Icon" width={60} height={60} />
            <p className="text-white">guest</p>
          </div>
          <div
            className="fileBox cursor-pointer"
            onClick={() => handleClick("Folder")}
          >
            <Image src="/folder.png" alt="Folder Icon" width={60} height={60} />
            <p className="text-white">Folder</p>
          </div>
        </main>
      </div>
      <Image
        src="/profilepic.jpg"
        alt="Profile Picture"
        width={100}
        height={100}
        className="rounded-full object-cover absolute right-5"
        style={{ top: "3%", aspectRatio: "1/1", right: "2%" }} // Ensures a perfect 1:1 aspect ratio
      />
    </div>
  );
}
