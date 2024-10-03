// app/components/HomeLayout.tsx
"use client"; // Marks this as a client component

import { ReactNode } from "react";
import "../HomePage/HomePage.css"; // Import custom CSS

interface HomeLayoutProps {
    children: ReactNode; // Allows any React nodes to be passed as children
}

export default function HomeLayout({ children }: HomeLayoutProps) {
    return (
        <div className="relative min-h-screen overflow-hidden home-layout-container select-none">
            {/* Video Background */}
            <video
                className="absolute top-0 left-0 w-full h-full object-cover -z-10"
                src="/background-video.mp4" // Ensure this video file is in the public folder
                autoPlay
                loop
                muted
                playsInline
            />

            {/* Static Stars and Moving Clouds */}
            <div className="background">
                <div className="stars"></div>
                <div className="clouds"></div>
            </div>

            {/* Content Wrapper with Overlay */}
            <div className="relative z-10 flex flex-col min-h-screen bg-black/60 text-white">
                {children} {/* Render the children inside the main content area */}
            </div>
        </div>
    );
}
