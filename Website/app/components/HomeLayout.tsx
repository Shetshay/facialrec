// app/components/HomeLayout.tsx
"use client";

import { ReactNode } from "react";
import "../HomePage/HomePage.css";

interface HomeLayoutProps {
    children: ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
    return (
        <div className="relative min-h-screen overflow-hidden home-layout-container select-none">
            <video
                className="absolute top-0 left-0 w-full h-full object-cover -z-10"
                // src="/background-video.mp4"
                autoPlay
                loop
                muted
                playsInline
            />

            <div className="background">
                <div className="stars"></div>
                <div className="clouds"></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen bg-black/60 text-white">
                {children}
            </div>
        </div>
    );
}