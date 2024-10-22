import os

# List of multimedia file extensions to search for
multimedia_extensions = ['.jpg', '.png', '.mp4', '.mp3', '.avi', '.mov', '.gif']

# Specific text files to delete
specific_text_files = ['logout.txt', 'origin.txt']

def find_multimedia_files(directory, extensions, specific_files):
    """Finds files in the specified directory with the given extensions and specific file names."""
    files_to_delete = []
    
    # Iterate over all the files in the directory
    for file_name in os.listdir(directory):
        # Check if the file has one of the specified extensions or is in the specific file list
        if any(file_name.endswith(ext) for ext in extensions) or file_name in specific_files:
            files_to_delete.append(file_name)
    
    return files_to_delete

def delete_files(file_list):
    """Deletes files from the current directory based on the provided list."""
    for file_name in file_list:
        if os.path.exists(file_name):
            os.remove(file_name)
            print(f"Deleted {file_name}")
        else:
            print(f"{file_name} not found")

if __name__ == "__main__":
    # Specify the directory where files should be checked (current directory in this case)
    directory = '.'
    
    # Find files to delete based on extensions and specific file names
    files_to_delete = find_multimedia_files(directory, multimedia_extensions, specific_text_files)
    
    # Delete the found files
    delete_files(files_to_delete)
