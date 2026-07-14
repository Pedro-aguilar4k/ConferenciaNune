import sys
import os

backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, os.path.normpath(backend_path))

from server import app  # noqa: E402,F401
