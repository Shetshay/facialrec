// app/page.tsx
import Layout from "../app/components/Layout"; // Import the Layout component
import Image from "next/image";

export default function Page() {
  return (
    <Layout>
      {/* Content specific to this page */}
      <div className="flex flex-col">
        <div className="flex items-center justify-center h-20 bg-blue-500 rounded-lg p-4">
          <h2 className="text-white">AcmeLogo Placeholder</h2>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex justify-center items-center p-6 bg-gray-50 rounded-lg shadow-md">
            <p className="text-xl text-gray-create">
              <strong className="text-black"> Welcome to FacialRec.</strong>
            </p>
          </div>

          <div className="flex justify-center p-6">
            <Image
              src="/hero-mobile.png"
              width={560}
              height={620}
              className="block md:hidden"
              alt="Screenshot of the dashboard project showing mobile version"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
