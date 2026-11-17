"""
Utilitaires pour l'extraction de texte par OCR (Optical Character Recognition).
Architecture hybride haute vitesse sur CPU (standard SEN-E-AGENCE `indra-ocr`) :
  1. Extraction native structurée via PyMuPDF (ordre de lecture + tableaux) pour PDF numériques.
  2. Moteur ONNX CPU (`rapidocr-onnxruntime`) avec reconstruction par boîtes englobantes (bbox).
  3. Fallback intelligent vers Tesseract (`fra+eng`) avec correction EXIF/OSD et contraste.
"""
import io
import logging
import os
import re
import tempfile

import docx
import fitz
import numpy as np
import PyPDF2
import pytesseract
from django.conf import settings
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

# Singleton paresseux pour éviter de recharger les modèles ONNX à chaque page
_RAPID_OCR_INSTANCE = None


def _get_onnx_ocr():
    """Charge et met en cache le moteur ONNX CPU (RapidOCR)."""
    global _RAPID_OCR_INSTANCE
    if _RAPID_OCR_INSTANCE is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _RAPID_OCR_INSTANCE = RapidOCR()
            logger.info("Moteur OCR ONNX CPU (RapidOCR) initialisé avec succès.")
        except Exception as e:
            logger.warning(f"Moteur ONNX indisponible, repli vers Tesseract: {e}")
            _RAPID_OCR_INSTANCE = False
    return _RAPID_OCR_INSTANCE if _RAPID_OCR_INSTANCE is not False else None


def _reconstruct_reading_order(ocr_result) -> str:
    """
    Reconstruit le texte dans l'ordre logique de lecture (haut -> bas, gauche -> droite)
    à partir des boîtes englobantes (`bbox`) retournées par le moteur ONNX.
    """
    if not ocr_result:
        return ''
    items = []
    for entry in ocr_result:
        if not entry or len(entry) < 2:
            continue
        box, txt = entry[0], str(entry[1]).strip()
        if not txt:
            continue
        ys = [pt[1] for pt in box]
        xs = [pt[0] for pt in box]
        y_center = sum(ys) / len(ys)
        y_height = max(ys) - min(ys)
        x_left = min(xs)
        items.append((y_center, max(y_height, 12.0), x_left, txt))

    if not items:
        return ''

    items.sort(key=lambda it: (it[0], it[2]))
    lines = []
    current_line = [items[0]]
    for item in items[1:]:
        prev = current_line[-1]
        # Même ligne si décalage vertical inférieur à 60% de la hauteur de ligne
        if abs(item[0] - prev[0]) <= max(prev[1], item[1]) * 0.6:
            current_line.append(item)
        else:
            current_line.sort(key=lambda it: it[2])
            lines.append(' '.join(it[3] for it in current_line))
            current_line = [item]

    current_line.sort(key=lambda it: it[2])
    lines.append(' '.join(it[3] for it in current_line))
    return '\n'.join(lines)


class OCRProcessor:
    """
    Classe pour gérer l'extraction de texte structurée des documents juridiques.
    """

    def __init__(self):
        tesseract_cmd = getattr(settings, 'TESSERACT_CMD', None)
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        self.ocr_languages = '+'.join(getattr(settings, 'OCR_LANGUAGES', ['fra', 'eng']))

    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Prétraite l'image : correction EXIF, redressement OSD si disponible,
        upscaling LANCZOS si petite résolution et normalisation du contraste.
        """
        try:
            if hasattr(ImageOps, 'exif_transpose'):
                image = ImageOps.exif_transpose(image)

            # Détection d'orientation physique via Tesseract OSD (silencieux si non critique)
            try:
                temp_img = image.convert('L') if image.mode != 'L' else image.copy()
                osd_data = pytesseract.image_to_osd(temp_img, config='--psm 0')
                rotate_match = re.search(r'Rotate: (\d+)', osd_data)
                if rotate_match:
                    angle = int(rotate_match.group(1))
                    if angle != 0:
                        image = image.rotate(360 - angle, expand=True)
            except Exception:
                pass

            if image.width < 1400 or image.height < 1400:
                scale_factor = min(2.5, max(1400 / max(image.width, 1), 1400 / max(image.height, 1)))
                new_size = (int(image.width * scale_factor), int(image.height * scale_factor))
                resample = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS
                image = image.resize(new_size, resample)

            if image.mode != 'RGB':
                image = image.convert('RGB')
            image = ImageOps.autocontrast(image)
            return image
        except Exception as e:
            logger.warning(f"Erreur prétraitement image: {e}")
            return image

    def _ocr_pil_image(self, image: Image.Image) -> str:
        """
        Applique d'abord le moteur ONNX CPU (RapidOCR) puis Tesseract en complément/fallback.
        """
        onnx_text = ''
        onnx_engine = _get_onnx_ocr()
        if onnx_engine is not None:
            try:
                rgb_img = image.convert('RGB') if image.mode != 'RGB' else image
                result, _ = onnx_engine(np.array(rgb_img))
                onnx_text = _reconstruct_reading_order(result)
            except Exception as e:
                logger.warning(f"Erreur moteur ONNX sur image: {e}")

        if len(onnx_text.strip()) >= 25:
            return onnx_text

        # Fallback Tesseract (avec niveaux de gris)
        try:
            gray = image.convert('L') if image.mode != 'L' else image
            tess_text = pytesseract.image_to_string(
                gray,
                lang=self.ocr_languages,
                config='--psm 3 -c preserve_interword_spaces=1',
            )
            return tess_text if len(tess_text.strip()) > len(onnx_text.strip()) else onnx_text
        except Exception as e:
            logger.warning(f"Fallback Tesseract indisponible: {e}")
            return onnx_text

    def extract_text_from_file(self, file_path):
        """
        Extrait le texte d'un fichier basé sur son extension.
        Retourne `(text, searchable_pdf_path, error_message)`.
        """
        try:
            if not file_path or not os.path.exists(file_path):
                return '', None, f'Fichier introuvable: {file_path}'

            ext = os.path.splitext(file_path)[1].lower()
            if ext == '.pdf':
                return self.extract_from_pdf(file_path)
            if ext == '.docx':
                text, error = self.extract_from_docx(file_path)
                return text, None, error
            if ext == '.doc':
                return '', None, "Le format .doc est ancien. Veuillez le convertir en .docx pour l'extraction."
            if ext in ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.gif', '.webp']:
                return self.extract_from_image(file_path)
            if ext == '.txt':
                text, error = self.extract_from_text(file_path)
                pdf_path, pdf_error = self.convert_txt_to_pdf(text, file_path)
                return text, pdf_path, error or pdf_error
            return '', None, f"Type de fichier non supporté pour l'OCR: {ext}"
        except Exception as e:
            logger.exception(f"Erreur lors de l'extraction de texte pour {file_path}")
            return '', None, f"Erreur système: {str(e)}"

    def extract_from_pdf(self, pdf_path):
        """
        Extraction intelligente hybride page par page :
        - Texte natif PyMuPDF (ordre de lecture) si la page contient du texte exploitable.
        - OCR ONNX CPU / Tesseract sur les pages scannées uniquement.
        """
        try:
            doc = fitz.open(pdf_path)
            page_texts = []
            for i in range(len(doc)):
                page = doc.load_page(i)
                native_text = (page.get_text("text", sort=True) or '').strip()

                if len(native_text) >= 30:
                    page_texts.append(native_text)
                else:
                    logger.info(f"Page {i + 1}/{len(doc)} scannée -> OCR ONNX/Tesseract")
                    pix = page.get_pixmap(matrix=fitz.Matrix(250 / 72, 250 / 72))
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    processed = self.preprocess_image(img)
                    ocr_text = self._ocr_pil_image(processed)
                    page_texts.append(ocr_text.strip() or native_text)
            doc.close()

            full_text = '\n\n'.join(t for t in page_texts if t)
            if not full_text.strip():
                # Ultime secours via PyPDF2
                with open(pdf_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    full_text = '\n'.join((p.extract_text() or '') for p in reader.pages).strip()

            searchable_pdf_path, error = self.convert_txt_to_pdf(full_text, pdf_path)
            return full_text, searchable_pdf_path, error
        except Exception as e:
            logger.error(f"Erreur extraction PDF {pdf_path}: {e}")
            return self.ocr_pdf_images(pdf_path)

    def ocr_pdf_images(self, pdf_path):
        """Fallback pur OCR image sur PDF."""
        try:
            doc = fitz.open(pdf_path)
            pages = []
            for i in range(len(doc)):
                page = doc.load_page(i)
                pix = page.get_pixmap(matrix=fitz.Matrix(250 / 72, 250 / 72))
                image = Image.open(io.BytesIO(pix.tobytes("png")))
                processed = self.preprocess_image(image)
                pages.append(self._ocr_pil_image(processed))
            doc.close()
            text = '\n\n'.join(p for p in pages if p.strip())
            searchable_pdf_path, error = self.convert_txt_to_pdf(text, pdf_path)
            return text, searchable_pdf_path, error
        except Exception as e:
            logger.error(f"Erreur OCR PDF avec PyMuPDF: {e}")
            return '', None, str(e)

    def extract_from_image(self, image_path):
        """Extrait le texte d'une image via ONNX CPU (RapidOCR) + fallback Tesseract."""
        try:
            image = Image.open(image_path)
            processed_image = self.preprocess_image(image)
            text = self._ocr_pil_image(processed_image)
            searchable_pdf_path, pdf_err = self.convert_txt_to_pdf(text, image_path)
            return text, searchable_pdf_path, pdf_err
        except Exception as e:
            logger.error(f"Erreur OCR image {image_path}: {e}")
            return '', None, str(e)

    def extract_from_text(self, text_path):
        try:
            with open(text_path, 'r', encoding='utf-8', errors='replace') as file:
                return file.read(), ''
        except Exception as e:
            return '', str(e)

    def convert_txt_to_pdf(self, text, original_path):
        """Convertit un texte UTF-8 en PDF A4 multi-pages propre."""
        try:
            doc = fitz.open()
            width, height = 595, 842
            margin = 50
            rect = fitz.Rect(margin, margin, width - margin, height - margin)

            if not text or not text.strip():
                text = (
                    "AVERTISSEMENT : Aucun texte lisible n'a pu être extrait de ce document.\n\n"
                    "Causes possibles : document scanné très flou, image sans texte ou page blanche."
                )

            lines = text.splitlines()
            lines_per_page = 52
            for i in range(0, max(1, len(lines)), lines_per_page):
                page = doc.new_page(width=width, height=height)
                chunk = "\n".join(lines[i:i + lines_per_page])
                page.insert_textbox(rect, chunk, fontsize=10.5, fontname="helv")

            temp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
            temp_pdf.close()
            doc.save(temp_pdf.name)
            doc.close()
            return temp_pdf.name, ''
        except Exception as e:
            logger.error(f"Erreur conversion TXT vers PDF: {e}")
            return None, str(e)

    def extract_from_docx(self, docx_path):
        try:
            d = docx.Document(docx_path)
            parts = [para.text for para in d.paragraphs if para.text.strip()]
            for table in d.tables:
                for row in table.rows:
                    row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_cells:
                        parts.append(' | '.join(row_cells))
            return '\n'.join(parts), ''
        except Exception as e:
            logger.error(f"Erreur extraction Word {docx_path}: {e}")
            return '', f"Erreur Word: {str(e)}"


def process_document_ocr(document):
    """
    Traite l'OCR pour un document donné (multi-pages ou fichier unique),
    sans jamais supprimer ni altérer les fichiers originaux.
    """
    processor = OCRProcessor()
    consolidated_text = []

    try:
        pages = document.pages.all().order_by('page_number')

        if not pages.exists() and document.file:
            from .models import DocumentPage
            DocumentPage.objects.create(
                document=document,
                file=document.file,
                page_number=1,
            )
            pages = document.pages.all().order_by('page_number')

        for page in pages:
            if not page.ocr_text:
                try:
                    file_path = page.file.path
                    text, searchable_pdf_path, _ = processor.extract_text_from_file(file_path)
                    page.ocr_text = text
                    page.save(update_fields=['ocr_text'])

                    if searchable_pdf_path and os.path.exists(searchable_pdf_path):
                        try:
                            os.remove(searchable_pdf_path)
                        except OSError:
                            pass
                except Exception as e:
                    logger.error(f"Erreur OCR sur page {page.page_number} du document {document.id}: {e}")

            if page.ocr_text:
                consolidated_text.append(f"[Page {page.page_number}]\n{page.ocr_text}")

        document.ocr_text = "\n\n".join(consolidated_text)
        document.ocr_processed = True
        document.ocr_error = ""
        document.save(update_fields=['ocr_text', 'ocr_processed', 'ocr_error'])

        if document.ocr_text:
            try:
                searchable_pdf_path, _ = processor.convert_txt_to_pdf(
                    document.ocr_text,
                    document.file.path if document.file else "merged.pdf",
                )
                if searchable_pdf_path and os.path.exists(searchable_pdf_path):
                    from django.core.files import File
                    from .models import DocumentVersion

                    last_version = DocumentVersion.objects.filter(document=document).order_by('-version_number').first()
                    next_version = (last_version.version_number + 1) if last_version else 1
                    new_filename = document.file_name or f"document_{document.id}.pdf"
                    if not new_filename.lower().endswith('.pdf'):
                        new_filename = f"{os.path.splitext(new_filename)[0]}.pdf"

                    with open(searchable_pdf_path, 'rb') as f:
                        django_file = File(f, name=f"Searchable_Full_{new_filename}")
                        DocumentVersion.objects.create(
                            document=document,
                            version_number=next_version,
                            file=django_file,
                            file_name=f"Searchable_Full_{new_filename}",
                            file_size=os.path.getsize(searchable_pdf_path),
                            comment="Version complète avec OCR (PDF Recherchable)",
                            uploaded_by=document.uploaded_by,
                        )
                    try:
                        os.remove(searchable_pdf_path)
                    except OSError:
                        pass
            except Exception as e:
                logger.error(f"Erreur génération PDF global searchable: {e}")

        logger.info(f"OCR traité pour document {document.id}: {len(document.ocr_text)} caractères sur {len(pages)} pages")

    except Exception as e:
        logger.error(f"Erreur globale traitement OCR document {document.id}: {e}")
        document.ocr_processed = True
        document.ocr_error = str(e)
        document.save(update_fields=['ocr_processed', 'ocr_error'])
