"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './FaceScreenshot.module.css';
import Head from 'next/head';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../Context/AuthContext';

const FaceScreenshot = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisImageRef = useRef<HTMLImageElement>(null);
  const [snapshotMessage, setSnapshotMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error('Error accessing webcam:', err));
    } else {
      alert('getUserMedia not supported in this browser.');
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const takeSnapshot = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');

    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('file', blob, 'snapshot.jpg');

          try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/getFacialData', {
              method: 'POST',
              body: formData,
              credentials: 'include',
            });

            if (response.ok) {
              setSnapshotMessage('Picture has been taken and processed');
              checkProcessedImage();
            } else {
              setSnapshotMessage('Error processing picture');
            }
          } catch (error) {
            console.error('Error uploading snapshot:', error);
            setSnapshotMessage('Error processing picture');
          } finally {
            setLoading(false);
          }
        }
      }, 'image/jpeg');
    }
  };

  const checkProcessedImage = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/check-image', {
        credentials: 'include',
      });
      if (response.ok) {
        const imageName = await response.text();
        if (analysisImageRef.current) {
          analysisImageRef.current.src = `http://localhost:3000/images/${imageName}`;
          analysisImageRef.current.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Error checking processed image:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Camera Feed</h1>
          {user && <p>Welcome, {user.firstName}!</p>}
        </header>
        
        {loading && (
          <div className={styles.loadingMessage}>
            Analyzing the image, please wait...
          </div>
        )}
        
        <div className={styles.videoSection}>
          <div className={styles.videoContainer}>
            <video ref={videoRef} width="640" height="480" autoPlay />
            <img ref={analysisImageRef} width="640" height="480" style={{ display: 'none' }} />
          </div>
          <div className={styles.buttonContainer}>
            <button onClick={takeSnapshot}>Take Snapshot</button>
            <button
              onClick={() => {
                window.location.href = process.env.NEXT_PUBLIC_LOGOUT_URL || 'http://localhost:3000/api/logout/google';
              }}
            >
              Logout
            </button>
          </div>
        </div>
        
        <div className={styles.message}>
          {snapshotMessage && <p>{snapshotMessage}</p>}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FaceScreenshot;