"""
run_server.py - Local development server using waitress (bypasses Python 3.14 asyncio multipart bug)
Usage: python run_server.py
"""
import sys
sys.path.insert(0, '.')

from main import app
from a2wsgi import ASGIMiddleware
from waitress import serve

wsgi_app = ASGIMiddleware(app)

if __name__ == "__main__":
    print("Starting PetNeo backend via waitress on http://127.0.0.1:8000 and http://[::1]:8000")
    print("(Using waitress to bypass Python 3.14 asyncio multipart deadlock on Windows)")
    serve(wsgi_app, listen='127.0.0.1:8000 [::1]:8000', threads=8)
