import cv2
import sys
import os  # Import os to check for file existence

# Load the face cascade classifier
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Define the default image path
default_image_path = 'origin.jpg'
alternative_image_path = 'logout.jpg'

# Check if the alternative image exists and use it if present; otherwise, use the default image
if os.path.exists(alternative_image_path):
    image_path = alternative_image_path
else:
    image_path = default_image_path

# Read the image from the determined path
frame = cv2.imread(image_path)
if frame is None:
    print("Error loading image")
    sys.exit(1)

# Convert image to grayscale for face detection
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

# Draw rectangles around detected faces
for (x, y, w, h) in faces:
    cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

# Save the modified image
cv2.imwrite('detected_' + image_path, frame)
