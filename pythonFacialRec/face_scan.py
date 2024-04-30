import cv2
import mediapipe as mp
import sys
import os

# Initialize MediaPipe Face Mesh for more detailed face structure
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Define image paths
default_image_path = 'origin.jpg'
alternative_image_path = 'logout.jpg'

# Select the image to use
image_path = alternative_image_path if os.path.exists(alternative_image_path) else default_image_path

# Load the image
frame = cv2.imread(image_path)
if frame is None:
    print("Error loading image")
    sys.exit(1)

# Convert image to RGB
frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

# Process the image and get face landmarks
results = face_mesh.process(frame_rgb)

# Check for the presence of faces
if not results.multi_face_landmarks:
    print("No faces detected.")
    sys.exit(1)

# Draw the face mesh
for face_landmarks in results.multi_face_landmarks:
    mp.solutions.drawing_utils.draw_landmarks(
        image=frame,
        landmark_list=face_landmarks,
        connections=mp_face_mesh.FACEMESH_CONTOURS,
        landmark_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1),
        connection_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(color=(0, 255, 255), thickness=1)
    )

# Save the modified image with detected face landmarks
cv2.imwrite('detected_' + image_path, frame)

# If further processing is needed for user verification, consider exporting the landmark data or using it directly here.
