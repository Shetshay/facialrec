import face_recognition
import cv2
import sys
import os

def encode_face(image):
    # Find all face locations and encodings in the image
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)
    return face_encodings

def get_upper_face_landmarks(image):
    """
    Get facial landmarks for the upper part of the face which is above the upper lip.
    """
    landmarks_list = []
    face_landmarks = face_recognition.face_landmarks(image)

    for face_landmark in face_landmarks:
        # Get the eyebrow points
        landmarks_list.extend(face_landmark['left_eyebrow'])
        landmarks_list.extend(face_landmark['right_eyebrow'])
        
        # Get the eye points
        landmarks_list.extend(face_landmark['left_eye'])
        landmarks_list.extend(face_landmark['right_eye'])
        
        # Get the nose bridge points
        landmarks_list.extend(face_landmark['nose_bridge'])

    return landmarks_list

def main(image_path):
    # Load the image file
    image = face_recognition.load_image_file(image_path)

    # Encode the face(s) in the image
    face_encodings = encode_face(image)
    
    # Get the upper face landmarks
    upper_face_landmarks = get_upper_face_landmarks(image)
    
    # Prepare to write the output to a file
    output_file_path = os.path.splitext(image_path)[0] + '.txt'
    with open(output_file_path, 'w') as file:
        # Check if any face encodings were found
        if face_encodings:
            for encoding in face_encodings:
                file.write("Face encoding: {}\n".format(encoding))
        else:
            file.write("No facial encodings found.\n")

        # Check if any upper face landmarks were found
        if upper_face_landmarks:
            file.write("Upper face landmarks: {}\n".format(upper_face_landmarks))
        else:
            file.write("No upper face landmarks found.\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        main(image_path)
    else:
        print("Usage: python3 face_data.py <image_path>")
