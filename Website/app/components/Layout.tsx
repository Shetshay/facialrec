// app/components/Layout.tsx
"use client"; // Marks this as a client component for interactive use
import Head from "next/head";
import Sidebar from "./Sidebar"; // Import Sidebar component
import { ReactNode, useState } from "react";
import { getTextColorForBackground } from "../utils/getTextColorForBackground"; // Correct import for utility function

interface LayoutProps {
  children: ReactNode; // Allows any React nodes to be passed as children
}

// Define themes for day (light mode) and night (dark mode)
const dayTheme = {
  layoutBg: '#f0f0f0', // Hex color for light mode
  contentBg: '#ffffff',
  sidebarBg: '#e0e0e0',
};

const nightTheme = {
  layoutBg: '#1a202c', // Hex color for dark mode
  contentBg: '#2d3748',
  sidebarBg: '#2d3748',
};

export default function Layout({ children }: LayoutProps) {
  const [isNightMode, setIsNightMode] = useState(true); // Manage day/night mode state

  const navItems = [
    { label: "DashBoard", href: "/UserPage" },
    { label: "User", href: "/user" },
    { label: "Files", href: "/files" },
  ];

  // Function to toggle between day and night modes
  const toggleTheme = () => {
    setIsNightMode(!isNightMode);
  };

  // Determine current theme
  const theme = isNightMode ? nightTheme : dayTheme;

  // Determine text color based on background brightness
  const layoutTextColor = getTextColorForBackground(theme.layoutBg);
  const contentTextColor = getTextColorForBackground(theme.contentBg);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Container for background layer */}
      <div className={`relative min-h-screen ${layoutTextColor}`} style={{ backgroundColor: theme.layoutBg }}>
        {/* Background layer beneath sidebar */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-50">
          {/* This is the background layer behind the sidebar */}
        </div>

        {/* Sidebar - Fixed position so it floats on top */}
        <Sidebar
          navItems={navItems}
          isNightMode={isNightMode}
          toggleTheme={toggleTheme} // Keep the night mode toggle functional
          theme={theme} // Pass the current theme to the sidebar
        />

        {/* Main content area */}
        <main className={`relative flex-1 p-6 ml-64 rounded-lg shadow-lg z-10 ${contentTextColor}`} style={{ backgroundColor: theme.contentBg }}>
          {children} {/* Render the children components inside the main content area */}
        </main>
      </div>
    </>
  );
}
