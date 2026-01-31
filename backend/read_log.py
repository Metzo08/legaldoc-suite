import os

log_file = r"c:\Users\hp\Downloads\LegalDoc Suite\backend\debug.log"

try:
    with open(log_file, "rb") as f:
        f.seek(0, os.SEEK_END)
        size = f.tell()
        f.seek(max(0, size - 5000), os.SEEK_SET)
        content = f.read().decode('utf-8', errors='replace')
        print(content)
except Exception as e:
    print(f"Error reading log: {e}")
