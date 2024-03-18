import cv2
import dlib
import face_recognition

# Initialize the camera
cap = cv2.VideoCapture(0)

# Load a sample image for face recognition
known_image = face_recognition.load_image_file("sample_image.jpg")
known_encoding = face_recognition.face_encodings(known_image)[0]

def recognize_faces(frame):
    # Find all face locations and encodings in the current frame
    face_locations = face_recognition.face_locations(frame)
    face_encodings = face_recognition.face_encodings(frame, face_locations)

    # Initialize an empty list to store recognized faces
    recognized_faces = []

    # Compare each face encoding with the known encoding
    for face_encoding in face_encodings:
        # Compare the current face encoding with the known encoding
        matches = face_recognition.compare_faces([known_encoding], face_encoding)
        
        # If a match is found, add it to the list of recognized faces
        if matches[0]:
            recognized_faces.append("Known Person")
        else:
            recognized_faces.append("Unknown Person")

    return recognized_faces

def main():
    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()

        # Recognize faces in the frame
        recognized_faces = recognize_faces(frame)
        
        # Draw rectangles around detected faces and display recognition results
        for (top, right, bottom, left), recognized_face in zip(face_recognition.face_locations(frame), recognized_faces):
            # Draw a rectangle around the face
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

            # Display the recognition result above the rectangle
            cv2.putText(frame, recognized_face, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Display the frame
        cv2.imshow('Face Recognition', frame)

        # Break the loop when 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release the camera and close all OpenCV windows
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
