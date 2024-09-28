// app/page.tsx
import Sidebar from "../app/components/Sidebar"; // Import the Sidebar component
import { lusitana, inter } from "../app/ui/fonts"; // Adjust path based on your structure
import Image from "next/image";

export default function Page() {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "User", href: "/user" },
    { label: "Files", href: "/files" },
    // Add more items here if needed
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar navItems={navItems} /> {/* Pass the navItems to the Sidebar */}

      {/* Main Content */}
      <main className="flex-1 p-6 ml-64"> {/* Add margin-left for main content to adjust for sidebar width */}
        <div className="flex flex-col">
          <div className="flex items-center justify-center h-20 bg-blue-500 rounded-lg p-4">
            <h2 className="text-white">AcmeLogo Placeholder</h2>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex justify-center items-center p-6 bg-gray-50 rounded-lg shadow-md">
              <p className={`text-xl text-gray-800 ${lusitana.className}`}>
                <strong>Welcome to FacialRec.</strong>
              </p>
            </div>

            <div className="flex justify-center p-6">
              <Image
                src="/hero-mobile.png"
                width={560}
                height={620}
                className="block md:hidden"
                alt="Screenshot of the dashboard project showing mobile version"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
