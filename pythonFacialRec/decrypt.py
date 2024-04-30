import os
import re
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def extract_floats(s):
    # This pattern will find all pairs of floats in the form (x.xx, y.yy)
    pattern = r'\(\s*([-+]?\d*\.\d+|\d+)\s*,\s*([-+]?\d*\.\d+|\d+)\s*\)'
    matches = re.findall(pattern, s)
    # Flatten the list of tuples and convert each to float
    floats = [float(num) for pair in matches for num in pair]
    return floats

directory_path = '/home/carlos/facialrec/pythonFacialRec'

# Determine which data file to use
data_file = 'logout.txt' if os.path.exists('logout.txt') else 'origin.txt'

# Read and preprocess the dataset from the chosen data file
with open(data_file, 'r') as f:
    data = f.read()
    data = extract_floats(data)

data_bytes = bytearray(str(data), 'utf-8')
digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
digest.update(data_bytes)
key = digest.finalize()[:16]

for filename in os.listdir(directory_path):
    file_path = os.path.join(directory_path, filename)
    if os.path.isfile(file_path) and filename.endswith('.enc'):
        with open(file_path, 'rb') as f:
            iv = f.read(16)
            encrypted_data = f.read()

        cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()

        original_filename = filename[:-4]
        decrypted_filename = "decrypted_" + original_filename
        decrypted_file_path = os.path.join(directory_path, decrypted_filename)
        
        with open(decrypted_file_path, 'wb') as f:
            f.write(decrypted_data)

        print(f"Decryption complete for: {decrypted_filename}")

        # Optional: Remove the original .enc file
        os.remove(file_path)
        print(f"Removed encrypted file: {filename}")
