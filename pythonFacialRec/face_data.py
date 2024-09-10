import cv2
import mediapipe as mp
import sys
import numpy as np
import os

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.3)

def encode_face(image):
    # Convert the image to RGB and process it to find face mesh
    results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    
    # If faces are detected, extract and encode the facial landmarks
    if results.multi_face_landmarks:
        face_landmarks = results.multi_face_landmarks[0].landmark
        # Normalize coordinates
        ih, iw, _ = image.shape
        encoded_face = np.array([(lm.x * iw, lm.y * ih) for lm in face_landmarks])
        return encoded_face
    return np.array([])

def weighted_distance(face1, face2):
    # Weights for the landmarks, with higher values for eyes and nose
    weights = np.ones(len(face1))
    eye_nose_indices = [33, 133, 263, 362]
    weights[eye_nose_indices] = 5  # Increase weight for these landmarks

    # Calculate weighted Euclidean distance
    if face1.size > 0 and face2.size > 0:
        diff = face1 - face2
        weighted_diff = diff * weights[:, np.newaxis]  # Apply weights to differences
        distance_value = np.linalg.norm(weighted_diff)
        return distance_value
    return float('inf')

def main(image1_path, image2_path):
    # Load the image files
    image1 = cv2.imread(image1_path)
    image2 = cv2.imread(image2_path)
    
    if image1 is None or image2 is None:
        print("Error loading images")
        sys.exit(1)

    # Encode the faces in the images
    face1_encodings = encode_face(image1)
    face2_encodings = encode_face(image2)

    # Compare the faces using the weighted distance
    distance_value = weighted_distance(face1_encodings, face2_encodings)
    max_distance = np.sqrt(len(face1_encodings)) * 100  # Adjusted maximum distance
    similarity_percentage = max(0, 100 - (distance_value / max_distance * 100))
    print(f"Distance value: {distance_value:.2f}")
    print(f"Similarity percentage: {similarity_percentage:.2f}%")
    result_text = "Images are considered to be of the same person." if similarity_percentage > 80 else "Images are not considered to be of the same person."
    print(result_text)

    # Prepare to write the output to a file
    output_file_path1 = os.path.splitext(image1_path)[0] + '.txt'
    output_file_path2 = os.path.splitext(image2_path)[0] + '.txt'
    with open(output_file_path1, 'w') as file1, open(output_file_path2, 'w') as file2:
        formatted_face1_encodings = ''.join(f"({x:.2f}, {y:.2f})\n" for x, y in face1_encodings)
        formatted_face2_encodings = ''.join(f"({x:.2f}, {y:.2f})\n" for x, y in face2_encodings)
        file1.write(f"Encoded face data: [{formatted_face1_encodings}]\n")
        file2.write(f"Encoded face data: [{formatted_face2_encodings}]\n")

if __name__ == "__main__":
    image1_path = 'origin.jpg'
    image2_path = 'logout.jpg'
    main(image1_path, image2_path)
