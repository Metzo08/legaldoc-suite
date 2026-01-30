import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "legaldoc.settings")
django.setup()

import documents.ocr
import inspect

print(f"Loaded documents.ocr from: {documents.ocr.__file__}")

try:
    src = inspect.getsource(documents.ocr.OCRProcessor.extract_text_from_file)
    print("--- Source of extract_text_from_file ---")
    print(src)
    print("----------------------------------------")
except Exception as e:
    print(f"Could not get source: {e}")

from documents.models import Document
from documents.ocr import process_document_ocr

try:
    doc = Document.objects.get(id=143)
    print(f"Testing ID 143: {doc.title} ({doc.file.name})")
    process_document_ocr(doc)
    doc.refresh_from_db()
    print(f"Versions: {[v.file_name for v in doc.versions.all()]}")
except Exception as e:
    print(f"Error testing: {e}")
