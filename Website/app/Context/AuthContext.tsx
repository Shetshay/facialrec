// app/Context/AuthContext.tsx
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  email: string;
  firstName: string;
  lastName: string;
  faceScannedStatus: boolean;
  profilePicture: string | null; // Add profile picture field
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Only '/' is public
  const PUBLIC_ROUTES = ["/"];

  const checkAuth = async () => {
    try {
      console.log("Checking authentication status...");
      const response = await fetch(`${process.env.NEXT_PUBLIC_USER_INFO_URL}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      console.log("Auth response status:", response.status);
      if (response.ok) {
        const userData = await response.json();
        console.log("User data received:", userData);
        if (userData.email) {
          setUser({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            faceScannedStatus: userData.faceScannedStatus,
            profilePicture: userData.profilePicture || null, // Add profile picture
          });
        } else {
          console.log("No user email in response");
          setUser(null);
        }
      } else {
        console.log("Auth check failed");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Route protection effect
  useEffect(() => {
    if (!isLoading) {
      // Allow access to public route (home page) regardless of auth status
      if (PUBLIC_ROUTES.includes(pathname)) {
        return;
      }

      // If not logged in, redirect to home
      if (!user) {
        console.log("Not logged in, redirecting to home");
        router.push("/");
        return;
      }

      // If logged in but face not scanned
      if (!user.faceScannedStatus) {
        // Only allow access to FaceScreenshot page
        if (pathname !== "/FaceScreenshot") {
          console.log("Face not scanned, redirecting to FaceScreenshot");
          router.push("/FaceScreenshot");
          return;
        }
      }

      if (user.faceScannedStatus && pathname === "/FaceScreenshot") {
        console.log("Face already scanned, redirecting to dashboard");
        router.push("/files");
        return;
      }

      // If user is logged in and face is scanned, they can access any route
      // No additional checks needed here as they have full access
    }
  }, [user, isLoading, pathname, router]);

  // Monitor user state changes
  useEffect(() => {
    console.log("Current user state:", user);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
