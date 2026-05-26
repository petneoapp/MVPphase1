import bcrypt

def hash_password(password: str) -> str:
    if not password:
        password = "default_password"
    # Bcrypt has a 72-byte limit. Truncate the password to stay within constraints.
    if len(password) > 72:
        password = password[:72]
    
    # Hash password using native bcrypt library directly
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        if len(plain_password) > 72:
            plain_password = plain_password[:72]
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

