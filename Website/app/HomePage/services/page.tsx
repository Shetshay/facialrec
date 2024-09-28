// app/HomePage/services/page.tsx
"use client";

import HomeLayout from "../../components/HomeLayout"; // Use the same HomeLayout with video background

export default function ServicesPage() {
    return (
        <HomeLayout>
            <div className="p-6 text-center">
                <h1 className="text-4xl font-bold mb-4">Our Services</h1>
                <p className="text-lg">
                    Discover the services we offer to help your business grow.
                </p>
            </div>
        </HomeLayout>
    );
}
