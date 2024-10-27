from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.asymmetric import rsa
from hmac import compare_digest
from hashlib import pbkdf2_hmac
from cryptography.exceptions import InvalidSignature
import secrets



private_key = rsa.generate_private_key(65537, 2048)
public_key = private_key.public_key()

def sign(message: str) -> str:
    signature = private_key.sign(
        message.encode(),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return signature.hex()

def validate(message: str, signature: str) -> bool:
    try:
        public_key.verify(
            bytes.fromhex(signature),
            message.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except InvalidSignature:
        return False


def hash_new_password(password: str) -> str:
    iterations = 100000
    salt = secrets.token_bytes(8)
    hash = pbkdf2_hmac('sha256',bytes(password,'utf-8'), salt, iterations, dklen=64)
    return f"pbkdf2:{iterations}:{salt.hex()}:{hash.hex()}"

def verify_hash(password: str, hashed_password: str) -> bool:
    algo, iterations, salt, known_hash = hashed_password.split(":")
    iterations = int(iterations)
    salt = bytes.fromhex(salt)
    known_hash = bytes.fromhex(known_hash)
    hash = pbkdf2_hmac('sha256',bytes(password,'utf-8'), salt, iterations, dklen=64)
    return compare_digest(known_hash, hash)
