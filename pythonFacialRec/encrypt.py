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

directory_path = os.path.dirname(os.path.abspath(__file__))

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
    if os.path.isfile(file_path) and os.path.splitext(filename)[1] in ['.jpg', '.png', '.mp4', '.mp3', '.avi', '.mov', '.gif']:
        with open(file_path, 'rb') as f:
            file_data = f.read()

        iv = os.urandom(16)
        cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        encrypted_data = encryptor.update(file_data) + encryptor.finalize()

        encrypted_filename = os.path.join(directory_path, filename + '.enc')
        with open(encrypted_filename, 'wb') as f:
            f.write(iv + encrypted_data)

        print(f"Encryption complete for: {filename}")
