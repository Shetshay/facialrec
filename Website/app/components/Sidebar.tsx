// app/components/Sidebar.tsx
"use client"; // Client component for interactive functionality

import Link from "next/link";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"; // Icons for open and close actions

type NavItem = {
    label: string;
    href: string;
};

interface SidebarProps {
    navItems: NavItem[];
}

export default function Sidebar({ navItems }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div>
            {/* Hamburger button to toggle sidebar; visible only when sidebar is closed */}
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="p-2 fixed top-4 left-4 z-20 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white transform ${isOpen ? "translate-x-0" : "-translate-x-full"
                    } transition-transform duration-300 ease-in-out z-10 flex flex-col justify-between`}
            >
                {/* Close Button inside the sidebar at the top-right */}
                <button
                    onClick={toggleSidebar}
                    className="p-2 absolute top-4 right-4 z-20 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 pt-16 space-y-2">
                    {/* Add padding to the top to avoid overlap */}
                    <ul>
                        {navItems.map((item, index) => (
                            <li key={index} className="list-none">
                                <Link href={item.href} className="block p-2 rounded hover:bg-gray-700">
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Navigation Footer */}
                <div className="bg-gray-900 py-4">
                    <h1 className="text-center text-lg font-bold">Navigation</h1>
                </div>
            </div>

            {/* Overlay to close sidebar when clicking outside */}
            {isOpen && (
                <div
                    onClick={toggleSidebar}
                    className="fixed inset-0 bg-black bg-opacity-50 z-0"
                ></div>
            )}
        </div>
    );
}
