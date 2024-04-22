import os

# List of files to delete
files_to_delete = [
    "origin.jpg",
    "logout.jpg",
    "origin.txt",
    "logout.txt",
    "detected_origin.jpg",
    "detected_logout.jpg",
    "decrypted_origin.jpg",
    "decrypted_logout.jpg",
    "decrypted_detected_origin.jpg",
    "decrypted_detected_logout.jpg"

]

def delete_files(file_list):
    """Deletes files from the current directory based on the provided list."""
    for file_name in file_list:
        if os.path.exists(file_name):
            os.remove(file_name)
            print(f"Deleted {file_name}")
        else:
            print(f"{file_name} not found")

if __name__ == "__main__":
    delete_files(files_to_delete)
