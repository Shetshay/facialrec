"use client"; // Marks this as a client component
import HomeLayout from "../app/components/HomeLayout"; // Import the new HomeLayout component
import "../app/HomePage/HomePage.css"; // Import custom CSS

export default function HomePage() {
  // Function to handle Google login
  const handleGoogleLogin = () => {
    const authUrl =
      process.env.NEXT_PUBLIC_AUTH_URL ||
      "http://localhost:3000/api/auth/signin/google"; // Adjusted to use 'signin' endpoint of NextAuth
    window.location.href = authUrl;
  };

  return (
    <HomeLayout>
      {/* Unique content of the HomePage */}
      <div className="home-page-container flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-5xl font-bold mb-6">Welcome to Facial Rec</h1>
        <p className="text-lg mb-8 max-w-md leading-relaxed">
          A secure, cloud-based storage system with advanced facial recognition technology.
        </p>

        {/* Single Button for Google Login */}
        <div className="button-group">
          <button
            onClick={handleGoogleLogin}
            className="custom-button px-6 py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 shadow-lg"
          >
            Sign Up / Login with Google
          </button>
        </div>
      </div>
    </HomeLayout>
  );
}
