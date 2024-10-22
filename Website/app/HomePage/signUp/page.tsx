// app/HomePage/about/page.tsx
"use client";

import HomeLayout from "../../components/HomeLayout"; // Use the same HomeLayout with video background

export default function AboutPage() {
  return (
    <HomeLayout>
      <div className="p-6 text-center select-none">
        {" "}
        {/* Added `select-none` class */}
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-lg">
          Learn more about our company, our values, and what drives us forward.
        </p>
      </div>
    </HomeLayout>
  );
}
