"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import FaceScreenshot from './FaceScreenshot';

export default function FaceScreenshotPage() {
  const { user, isLoading } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading && !initialized) {
      setInitialized(true);
      console.log('FaceScreenshot Page mounted - User:', user);
    }
  }, [isLoading, user, initialized]);

  return <FaceScreenshot />;
}