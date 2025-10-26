"""Start the uvicorn server as a subprocess, test the root endpoint, then stop.

Usage:
    python scripts\run_and_test_server.py

This script is a convenience for local dev to start the app, hit `/`, and
confirm the server responds. It requires `uvicorn` to be available in PATH
(e.g., from the active virtualenv).
"""

import subprocess
import sys
import time
import urllib.request

CMD = [
    sys.executable,
    "-m",
    "uvicorn",
    "app.main:app",
    "--host",
    "127.0.0.1",
    "--port",
    "8000",
]


def wait_for_http(url, timeout=10.0):
    start = time.time()
    while True:
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                return r.status, r.read().decode()
        except Exception:
            if time.time() - start > timeout:
                raise
            time.sleep(0.25)


def main():
    print("Starting uvicorn subprocess...")
    proc = subprocess.Popen(CMD, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        status, body = wait_for_http("http://127.0.0.1:8000/", timeout=15)
        print("HTTP status:", status)
        print("Body:", body)
    except Exception as e:
        print("Failed to contact server:", e)
        # print partial logs
        try:
            out = proc.stdout.read().decode(errors="ignore")
            print("Server output:\n", out)
        except Exception:
            pass
    finally:
        print("Stopping uvicorn subprocess...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()


if __name__ == "__main__":
    main()
