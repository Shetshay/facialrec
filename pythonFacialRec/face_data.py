import cv2
import face_recognition
import os
import sys
import numpy as np
import logging
from scipy.stats import pearsonr
from sklearn.metrics.pairwise import cosine_similarity

# ANSI escape sequences for colored output
RED = "\033[91m"
GREEN = "\033[92m"
RESET = "\033[0m"

# Set up logging for better control over output
logging.basicConfig(level=logging.INFO, format='%(message)s')

# Function to calculate Pearson Correlation Coefficient (PCC)
def calculate_pcc(encoding1, encoding2):
    pcc, _ = pearsonr(encoding1, encoding2)
    return pcc

# Function to calculate Cosine Similarity between two encodings
def calculate_cosine_similarity(encoding1, encoding2):
    encoding1_reshaped = encoding1.reshape(1, -1)
    encoding2_reshaped = encoding2.reshape(1, -1)
    cos_sim = cosine_similarity(encoding1_reshaped, encoding2_reshaped)[0][0]
    return cos_sim

# Function to compare two facial encodings using multiple methods
def compare_faces(encoding1, encoding2, tolerance=0.6):
    # Calculate Euclidean distance between the encodings
    distance = np.linalg.norm(encoding1 - encoding2)
    # Calculate Pearson Correlation Coefficient (PCC)
    pcc = calculate_pcc(encoding1, encoding2)
    # Calculate Cosine Similarity
    cosine_sim = calculate_cosine_similarity(encoding1, encoding2)

    # Return the individual metrics
    return distance, pcc, cosine_sim

# Function to calculate a weighted score based on multiple metrics
def calculate_weighted_score(distance, pcc, cosine_sim, tolerance=0.6):
    # Weights for each metric (adjust as needed)
    weight_euclidean = 0.3
    weight_pcc = 0.4
    weight_cosine = 0.3

    # Normalize Euclidean distance to a 0-1 range (1 means perfect match, 0 means mismatch)
    # Assuming tolerance is the max acceptable distance for a match
    normalized_distance = max(0, (tolerance - distance) / tolerance)

    # PCC and Cosine Similarity are already in the 0-1 range
    # Combine the weighted scores
    weighted_score = (weight_euclidean * normalized_distance) + \
                     (weight_pcc * pcc) + \
                     (weight_cosine * cosine_sim)

    return weighted_score

# Function to extract face encoding from an image file
def get_face_encoding(image_path):
    image = face_recognition.load_image_file(image_path)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        raise ValueError(f"No face detected in '{image_path}'.")

    return encodings[0]

# Main program to compare origin.jpg and logout.jpg
def main():
    origin_image_path = '../goDatabase/origin.jpg'
    logout_image_path = '../goDatabase/logout.jpg'

    # Check if both images exist in the directory
    if not os.path.exists(origin_image_path) or not os.path.exists(logout_image_path):
        logging.error("Error: Both 'origin.jpg' and 'logout.jpg' must exist in the current directory.")
        sys.exit(1)

    try:
        # Extract face encodings from both images
        origin_encoding = get_face_encoding(origin_image_path)
        logout_encoding = get_face_encoding(logout_image_path)

        # Compare the faces using multiple methods
        distance, pcc, cosine_sim = compare_faces(origin_encoding, logout_encoding)

        # Calculate a weighted score
        weighted_score = calculate_weighted_score(distance, pcc, cosine_sim)

        # Print results with calculational data
        logging.info(f"Comparison between '{origin_image_path}' and '{logout_image_path}':")
        logging.info(f"Euclidean distance: {distance:.4f}")
        logging.info(f"Pearson Correlation Coefficient (PCC): {pcc:.4f}")
        logging.info(f"Cosine Similarity: {cosine_sim:.4f}")
        logging.info(f"Weighted Score: {weighted_score:.4f}")

        # Final decision based on weighted score (threshold can be adjusted)
        if weighted_score > 0.8:
            logging.info(f"{GREEN}Result: The faces are of the same person.{RESET}")
        else:
            logging.info(f"{RED}Result: The faces are of different people.{RESET}")

        # Prepare to write the output to a file in the format (x, y)
        output_file_path1 = os.path.splitext(origin_image_path)[0] + '.txt'
        output_file_path2 = os.path.splitext(logout_image_path)[0] + '.txt'

        with open(output_file_path1, 'w') as file1, open(output_file_path2, 'w') as file2:
            formatted_origin_encoding = ''.join(f"({x:.2f}, {y:.2f})\n" for x, y in enumerate(origin_encoding))
            formatted_logout_encoding = ''.join(f"({x:.2f}, {y:.2f})\n" for x, y in enumerate(logout_encoding))
            file1.write(f"Landmark positions for '{origin_image_path}':\n{formatted_origin_encoding}\n")
            file2.write(f"Landmark positions for '{logout_image_path}':\n{formatted_logout_encoding}\n")

    except ValueError as e:
        logging.error(e)
        sys.exit(1)

if __name__ == "__main__":
    main()
