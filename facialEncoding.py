import cv2
import face_recognition

# Initialize the camera
cap = cv2.VideoCapture(0)

def encode_face(image):
    # Find all face locations and encodings in the image
    face_locations = face_recognition.face_locations(image)
    face_encodings = face_recognition.face_encodings(image, face_locations)
    
    return face_encodings

def main():
    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()

        # Encode the face
        face_encodings = encode_face(frame)
        
        # Print the facial encodings
        if face_encodings:
            print("Facial Encodings:", face_encodings)
        
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
