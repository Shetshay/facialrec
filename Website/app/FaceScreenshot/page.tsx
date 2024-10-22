"use client"; // Add this to mark the component as a Client Component
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';  // Import useRouter from next/navigation
import styles from './FaceScreenshot.module.css';
import Head from 'next/head';

const FaceScreenshot = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisImageRef = useRef<HTMLImageElement>(null);
  const [snapshotMessage, setSnapshotMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();  // Initialize useRouter from next/navigation

  // Access the webcam
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
  }, []);

  // Handle Snapshot
  const takeSnapshot = () => {
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
            // Upload snapshot to your backend
            const response = await fetch('http://localhost:8080/upload', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              setSnapshotMessage('Picture has been taken and processed');
              // After taking the snapshot, redirect to the UserPage
              router.push('/UserPage');
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

  return (
    <>
      <Head>
        <title>Camera Feed</title>
      </Head>
      <div className={darkMode ? styles.darkMode : ''}>
        <header>
          <h1>Camera Feed Test</h1>
        </header>
        <div className={styles.instructionMessage}>
          Press the spacebar to take a picture or click the 'Take Snapshot' button.
        </div>
        {loading && (
          <div className={styles.loadingMessage}>
            Analyzing the image, please wait...
          </div>
        )}
        <div className={styles.videoContainer}>
          <video ref={videoRef} width="640" height="480" autoPlay />
          <img ref={analysisImageRef} width="640" height="480" style={{ display: 'none' }} />
        </div>
        <div className={styles.buttonContainer}>
          <button onClick={takeSnapshot}>Take Snapshot</button>
        </div>
        <div className={styles.message}>
          {snapshotMessage && <p>{snapshotMessage}</p>}
        </div>
      </div>
    </>
  );
};

export default FaceScreenshot;
