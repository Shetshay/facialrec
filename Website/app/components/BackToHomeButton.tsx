// app/components/BackToHomeButton.tsx
"use client"; // Make this a client component since it uses interactivity

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline"; // Optional: Heroicons for back arrow icon

export default function BackToHomeButton() {
    return (
        <div className="fixed top-4 left-4">
            <Link href="/" className="flex items-center p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                <ArrowLeftIcon className="h-5 w-5 mr-2" /> {/* Optional icon */}
                Back to Home
            </Link>
        </div>
    );
}
