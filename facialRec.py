import cv2
import dlib

# Initialize the camera
cap = cv2.VideoCapture(0)

# Initialize dlib's face detector and facial landmark predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

# Initialize an empty list to store facial landmarks
all_landmarks = []

def get_facial_landmarks(image):
    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Detect faces in the grayscale image
    faces = detector(gray)

    # Initialize an empty list to store facial landmark coordinates
    landmarks = []

    # Loop over the detected faces
    for face in faces:
        # Predict facial landmarks for each face
        shape = predictor(gray, face)
        
        # Loop over the 68 facial landmarks
        for i in range(0, 68):
            # Get the x and y coordinates of the ith facial landmark
            x = shape.part(i).x
            y = shape.part(i).y
            # Append the coordinates to the list of landmarks
            landmarks.append((x, y))

    return landmarks

def main():
    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()

        # Get facial landmarks
        landmarks = get_facial_landmarks(frame)
        
        # Append the detected landmarks to the list
        all_landmarks.append(landmarks)

        # Display the frame
        cv2.imshow('Facial Landmarks', frame)

        # Break the loop when 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release the camera and close all OpenCV windows
    cap.release()
    cv2.destroyAllWindows()

    # Print or further process the detected facial landmarks
    print("Detected facial landmarks:", all_landmarks)

if __name__ == "__main__":
    main()
