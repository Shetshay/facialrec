// app/components/Layout.tsx
"use client";
import Head from "next/head";
import Sidebar from "./Sidebar";
import { ReactNode, useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

const dayTheme = {
  layoutBg: "#f0f0f0",
  contentBg: "#ffffff",
  sidebarBg: "#e0e0e0",
  layoutTextColor: "#000000",
  contentTextColor: "#000000",
  sidebarTextColor: "#000000",
  toggleBtnBg: "#000000",
  toggleBtnText: "#ffffff",
  hoverBg: "#d0d0d0",
};

const nightTheme = {
  layoutBg: "#1a202c",
  contentBg: "#2d3748",
  sidebarBg: "#2d3748",
  layoutTextColor: "#ffffff",
  contentTextColor: "#ffffff",
  sidebarTextColor: "#ffffff",
  toggleBtnBg: "#ffffff",
  toggleBtnText: "#000000",
  hoverBg: "#3b4758",
};

export default function Layout({ children }: LayoutProps) {
  const [isNightMode, setIsNightMode] = useState(true);

  const navItems = [
    { label: "User", href: "/user" },
    { label: "Files", href: "/files" },
    {
      label: "Logout",
      onClick: () => (window.location.href = `${process.env.NEXT_PUBLIC_LOGOUT_URL}`),
    },
  ];

  const toggleTheme = () => {
    setIsNightMode(!isNightMode);
  };

  const theme = isNightMode ? nightTheme : dayTheme;

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        className="relative min-h-screen"
        style={{ backgroundColor: theme.layoutBg, color: theme.layoutTextColor }}
      >
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-50"></div>

        <Sidebar
          navItems={navItems}
          isNightMode={isNightMode}
          toggleTheme={toggleTheme}
          theme={theme}
        />

        <main
          className="relative flex-1 p-6 ml-64 shadow-lg z-10"
          style={{ backgroundColor: theme.contentBg, color: theme.contentTextColor }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
