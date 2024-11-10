// app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Bars3Icon, XMarkIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";

type NavItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

interface SidebarProps {
  navItems: NavItem[];
  isNightMode: boolean;
  toggleTheme: () => void;
  theme: {
    sidebarBg: string;
    sidebarTextColor: string;
    toggleBtnBg: string;
    toggleBtnText: string;
    hoverBg: string;
  };
}

export default function Sidebar({ navItems, isNightMode, toggleTheme, theme }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="p-2 fixed top-4 left-4 z-20 rounded-md hover:bg-opacity-80"
          style={{ backgroundColor: theme.sidebarBg, color: theme.sidebarTextColor }}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      )}

      <div
        className={`fixed top-0 left-0 h-full w-64 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-20 flex flex-col justify-between`}
        style={{ backgroundColor: theme.sidebarBg, color: theme.sidebarTextColor }}
      >
        <button
          onClick={toggleSidebar}
          className="p-2 absolute top-4 right-4 z-20 rounded-md hover:bg-opacity-80"
          style={{ color: theme.sidebarTextColor }}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 pt-16 space-y-2">
          <ul>
            {navItems.map((item, index) => (
              <li key={index} className="list-none">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`block p-2 rounded ${
                      isNightMode ? "hover:bg-gray-700" : "hover:bg-gray-300"
                    }`}
                    style={{ color: theme.sidebarTextColor }}
                    onClick={toggleSidebar}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      item.onClick && item.onClick();
                      toggleSidebar();
                    }}
                    className={`block p-2 w-full text-left rounded ${
                      isNightMode ? "hover:bg-gray-700" : "hover:bg-gray-300"
                    }`}
                    style={{ color: theme.sidebarTextColor }}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Theme Toggle Button */}
        <div
          className="relative py-4 flex items-center justify-between"
          style={{ backgroundColor: theme.sidebarBg }}
        >
          <h1
            className="text-center text-lg font-bold flex-grow"
            style={{ color: theme.sidebarTextColor }}
          >
            Navigation
          </h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full mr-4 hover:bg-opacity-80"
            title={isNightMode ? "Switch to Day Mode" : "Switch to Night Mode"}
            style={{ backgroundColor: theme.toggleBtnBg, color: theme.toggleBtnText }}
          >
            {isNightMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
