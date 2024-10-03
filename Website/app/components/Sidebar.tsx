// app/components/Sidebar.tsx
"use client"; // Client component for interactive functionality

import Link from "next/link";
import { useState } from "react";
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline"; // Icons for open, close, day, and night actions
import { getTextColorForBackground } from "../utils/getTextColorForBackground"; // Correct import for utility function

type NavItem = {
    label: string;
    href: string;
};

interface SidebarProps {
    navItems: NavItem[];
    isNightMode: boolean; // Receive theme state from Layout
    toggleTheme: () => void; // Receive toggle function from Layout
    theme: {
        sidebarBg: string;
    };
}

export default function Sidebar({ navItems, isNightMode, toggleTheme, theme }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen); // Sidebar open/close toggle remains independent of theme toggle
    };

    // Determine text color for the sidebar based on background brightness
    const sidebarTextColor = getTextColorForBackground(theme.sidebarBg);

    return (
        <div>
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className={`p-2 fixed top-4 left-4 z-20 ${sidebarTextColor} rounded-md hover:bg-opacity-80`}
                    style={{ backgroundColor: theme.sidebarBg }}
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
            )}

            <div
                className={`fixed top-0 left-0 h-full w-64 ${sidebarTextColor}
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-300 ease-in-out z-10 flex flex-col justify-between`}
                style={{ backgroundColor: theme.sidebarBg }}
            >
                <button
                    onClick={toggleSidebar}
                    className={`p-2 absolute top-4 right-4 z-20 ${sidebarTextColor} rounded-md hover:bg-opacity-80`}
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>

                <nav className="flex-1 p-4 pt-16 space-y-2">
                    <ul>
                        {navItems.map((item, index) => (
                            <li key={index} className="list-none">
                                <Link href={item.href} className={`block p-2 rounded hover:bg-gray-700 ${sidebarTextColor}`}>
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Add Theme Toggle Button */}
                <div className={`relative py-4 flex items-center justify-between ${theme.sidebarBg}`}>
                    <h1 className={`text-center text-lg font-bold flex-grow ${sidebarTextColor}`}>Navigation</h1>
                    <button
                        onClick={toggleTheme} // Keep this to toggle between day and night modes
                        className={`absolute bottom-4 right-4 p-2 rounded-full ${theme.sidebarBg} ${sidebarTextColor} hover:bg-opacity-80`}
                        title={isNightMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
                    >
                        {isNightMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
