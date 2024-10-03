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
    { label: "Home", href: "/" },
    { label: "User", href: "/user" },
    { label: "Files", href: "/files" },
    { label: "HomePage", href: "/HomePage" },
  ];

  // Function to toggle between day and night modes
  const toggleTheme = () => {
    setIsNightMode(!isNightMode); // This should still toggle night and day themes
  };

  // Determine current theme
  const theme = isNightMode ? nightTheme : dayTheme;

  // Use the utility function to determine the appropriate text color based on background brightness
  const layoutTextColor = getTextColorForBackground(theme.layoutBg);
  const contentTextColor = getTextColorForBackground(theme.contentBg);

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={`flex min-h-screen ${layoutTextColor} select-none`} style={{ backgroundColor: theme.layoutBg }}>
        {/* Sidebar */}
        <Sidebar
          navItems={navItems}
          isNightMode={isNightMode}
          toggleTheme={toggleTheme} // Keep the night mode toggle functional
          theme={theme} // Pass the current theme to the sidebar
        />

        {/* Main Content */}
        <main className={`flex-1 p-6 ml-64 rounded-lg shadow-lg overflow-y-auto ${contentTextColor}`} style={{ backgroundColor: theme.contentBg }}>
          {children} {/* Render the children components inside the main content area */}
        </main>
      </div>
    </>
  );
}
