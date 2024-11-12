from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
import secrets

class UserEncryption:
    def __init__(self):
        self.SERVER_SECRET = self._get_server_secret()

    def _get_server_secret(self) -> str:
        """
        Get or generate the server secret.
        """
        server_secret = os.getenv('PYTHON_SECRET')
        if not server_secret:
            print("python server secret not in env")
            return
        return server_secret

    def generate_user_salt(self) -> bytes:
        """
        Generate a new salt for a user.
        This should be stored in the database with the user's data.
        """
        return os.urandom(16)

    def generate_key(self, oauth_user_id: str, user_salt: bytes) -> bytes:
        """
        Generate an encryption key based on OAuth user ID and server secret.
        Uses the user's personal salt for key derivation.
        """
        key_material = f"{oauth_user_id}:{self.SERVER_SECRET}".encode()

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=user_salt,
            iterations=100000,
        )

        key = base64.urlsafe_b64encode(kdf.derive(key_material))
        return key

    def encrypt_data(self, data: str, oauth_user_id: str, user_salt: bytes = None) -> tuple[str, str]:
        """
        Encrypt data using a key derived from the user's OAuth ID.

        Args:
            data: The data to encrypt
            oauth_user_id: User's OAuth ID
            user_salt: User's salt (if None, a new one will be generated)

        Returns:
            tuple: (encrypted_data, base64_encoded_salt)
        """
        if user_salt is None:
            user_salt = self.generate_user_salt()

        key = self.generate_key(oauth_user_id, user_salt)
        f = Fernet(key)
        encrypted_data = f.encrypt(data.encode())

        # Return both encrypted data and salt (both base64 encoded for easy storage)
        return (
            base64.urlsafe_b64encode(encrypted_data).decode(),
            base64.b64encode(user_salt).decode()
        )

    def encrypt_list(self, data: list, oauth_user_id: str, user_salt: bytes = None) -> tuple[list[str], str]:
        """
        Encrypt data using a key derived from the user's OAuth ID.

        Args:
            data: The data to encrypt
            oauth_user_id: User's OAuth ID
            user_salt: User's salt (if None, a new one will be generated)

        Returns:
            tuple: (encrypted_data, base64_encoded_salt)
        """
        if user_salt is None:
            user_salt = self.generate_user_salt()

        key = self.generate_key(oauth_user_id, user_salt)
        f = Fernet(key)

        encrypted_data_list = [base64.urlsafe_b64encode(f.encrypt(str(item).encode())).decode() for item in data]

        # Return both encrypted data and salt (both base64 encoded for easy storage)
        return (
            encrypted_data_list,
            base64.b64encode(user_salt).decode()
        )

    def decrypt_list(self, encrypted_data: list, oauth_user_id: str, stored_salt: str) -> str:
        """
        Decrypt data using a key derived from the user's OAuth ID and their stored salt.

        Args:
            encrypted_data: Base64 encoded encrypted data
            oauth_user_id: User's OAuth ID
            stored_salt: Base64 encoded salt from database

        Returns:
            Decrypted data as string
        """
        try:
            # Decode the stored salt
            user_salt = base64.b64decode(stored_salt)

            key = self.generate_key(oauth_user_id, user_salt)
            f = Fernet(key)

            decrypted_data = [float(f.decrypt(base64.urlsafe_b64decode(item)).decode()) for item in encrypted_data]

            return decrypted_data
        except Exception as e:
            raise ValueError(f"Unable to decrypt data. Invalid key or corrupted data. {e}")



    def decrypt_data(self, encrypted_data: str, oauth_user_id: str, stored_salt: str) -> str:
        """
        Decrypt data using a key derived from the user's OAuth ID and their stored salt.

        Args:
            encrypted_data: Base64 encoded encrypted data
            oauth_user_id: User's OAuth ID
            stored_salt: Base64 encoded salt from database

        Returns:
            Decrypted data as string
        """
        try:
            # Decode the stored salt
            user_salt = base64.b64decode(stored_salt)

            key = self.generate_key(oauth_user_id, user_salt)
            f = Fernet(key)
            decrypted_data = f.decrypt(base64.urlsafe_b64decode(encrypted_data))
            return decrypted_data.decode()
        except Exception as e:
            raise ValueError("Unable to decrypt data. Invalid key or corrupted data.")

# Example usage showing database storage pattern:
if __name__ == "__main__":
    encryption = UserEncryption()

    def get_from_db(user_id: str) -> dict:
        return db_storage.get(user_id)

    # Example encryption and storage
    oauth_user_id = "user123"
    sensitive_data = "This is sensitive user information"

    # Encrypt data (generates new salt)
    encrypted_data, user_salt = encryption.encrypt_data(sensitive_data, oauth_user_id)

    # Store in database
    store_in_db(oauth_user_id, encrypted_data, user_salt)

    # Later... retrieve and decrypt
    stored_data = get_from_db(oauth_user_id)
    if stored_data:
        decrypted = encryption.decrypt_data(
            stored_data['encrypted_data'],
            oauth_user_id,
            stored_data['salt']
        )
        assert sensitive_data == decrypted
        print("Successfully encrypted and decrypted with user-specific salt!")

