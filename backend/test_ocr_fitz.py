import os
import io
import fitz
import pytesseract
import PyPDF2
from PIL import Image
import tempfile

def test():
    pdf_path = r'c:\Users\hp\Downloads\LegalDoc Suite\backend\media\documents\CAHIER_DE_CHARGE.pdf'
    tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    
    print(f"Testing file: {pdf_path}")
    if not os.path.exists(pdf_path):
        print("FILE NOT FOUND!")
        return

    try:
        print("Opening PDF with fitz...")
        doc = fitz.open(pdf_path)
        print(f"Pages: {len(doc)}")
        
        pdf_writer = PyPDF2.PdfWriter()
        full_text = ""
        
        for i in range(len(doc)):
            print(f"Processing page {i+1}...")
            page = doc.load_page(i)
            pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
            image = Image.open(io.BytesIO(pix.tobytes("png")))
            
            print(f"Running Tesseract OCR on page {i+1}...")
            page_text = pytesseract.image_to_string(image, lang='fra')
            full_text += page_text
            
            print(f"Generating searchable PDF layer for page {i+1}...")
            page_pdf_data = pytesseract.image_to_pdf_or_hocr(image, lang='fra', extension='pdf')
            
            pdf_page_reader = PyPDF2.PdfReader(io.BytesIO(page_pdf_data))
            pdf_writer.add_page(pdf_page_reader.pages[0])
            print(f"Page {i+1} added.")

        print("Writing final PDF...")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            pdf_writer.write(tmp)
            print(f"SUCCESS! Searchable PDF generated at: {tmp.name}")
            print(f"PDF Size: {os.path.getsize(tmp.name)} bytes")
            print(f"Extracted text length: {len(full_text)}")
        
        doc.close()
        
    except Exception as e:
        import traceback
        print(f"FAILED with error: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    test()
