// app/components/Layout.tsx
"use client"; // Marks this as a client component for interactive use

import Sidebar from "./Sidebar"; // Import Sidebar component
import { ReactNode } from "react";

interface LayoutProps {
    children: ReactNode; // Allows any React nodes to be passed as children
}

export default function Layout({ children }: LayoutProps) {
    const navItems = [
        { label: "Home", href: "/" },
        { label: "User", href: "/user" },
        { label: "Files", href: "/files" },
        { label: "HomePage", href: "/HomePage" },
        // Add more items here if needed
    ];

    return (
        <div className="flex min-h-screen bg-gray-100 select-none"> {/* Added `select-none` to prevent text selection */}
            {/* Sidebar */}
            <Sidebar navItems={navItems} />

            {/* Main Content */}
            <main className="flex-1 p-6 ml-64 bg-white rounded-lg shadow-lg overflow-y-auto select-none">
                {children} {/* Render the children components inside the main content area */}
            </main>
        </div>
    );
}
