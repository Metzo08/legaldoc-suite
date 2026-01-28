"""
Utilitaires pour l'extraction de texte par OCR (Optical Character Recognition).
"""
import pytesseract
from pdf2image import convert_from_path
from PIL import Image, ImageOps
import PyPDF2
import os
import tempfile
import docx
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class OCRProcessor:
    """
    Classe pour gérer l'extraction de texte des documents.
    """
    
    def __init__(self):
        """
        Initialise le processeur OCR.
        """
        if hasattr(settings, 'TESSERACT_CMD') and settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
        
        self.ocr_languages = '+'.join(getattr(settings, 'OCR_LANGUAGES', ['fra', 'eng']))
    
    def preprocess_image(self, image):
        """
        Prétraite l'image pour améliorer la qualité OCR.
        - Conversion en niveaux de gris
        - Augmentation du contraste
        """
        try:
            # Conversion en niveaux de gris
            if image.mode != 'L':
                image = image.convert('L')
            
            # Augmentation du contraste
            image = ImageOps.autocontrast(image)
            return image
        except Exception as e:
            logger.warning(f"Erreur prétraitement image: {str(e)}")
            return image

    def extract_text_from_file(self, file_path):
        """
        Extrait le texte d'un fichier basé sur son extension.
        
        Args:
            file_path (str): Chemin vers le fichier
            
        Returns:
            tuple: (texte_extrait, erreur)
        """
        try:
            ext = os.path.splitext(file_path)[1].lower()
            
            if ext == '.pdf':
                return self.extract_from_pdf(file_path)
            elif ext in ['.docx']:
                return self.extract_from_docx(file_path)
            elif ext in ['.doc']:
                return '', 'Le format .doc est ancien. Veuillez le convertir en .docx pour l\'extraction.'
            elif ext in ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.gif']:
                return self.extract_from_image(file_path)
            elif ext in ['.txt']:
                return self.extract_from_text(file_path)
            else:
                return '', f'Type de fichier non supporté pour l\'OCR: {ext}'
                
        except Exception as e:
            logger.exception(f"Erreur lors de l'extraction de texte pour {file_path}")
            return '', f"Erreur système: {str(e)}"
    
    def extract_from_pdf(self, pdf_path):
        """
        Extrait le texte d'un fichier PDF.
        Essaie d'abord l'extraction directe, puis l'OCR si nécessaire.
        
        Args:
            pdf_path (str): Chemin vers le PDF
            
        Returns:
            tuple: (texte_extrait, erreur)
        """
        try:
            # Tentative 1: Extraction directe du texte (PDF avec texte)
            text = ''
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() or ''
            
            # Si on a du texte, on le retourne
            if text.strip():
                logger.info(f"Texte extrait directement du PDF: {len(text)} caractères")
                return text, ''
            
            # Tentative 2: OCR si pas de texte (PDF scanné)
            logger.info("PDF sans texte, utilisation de l'OCR...")
            return self.ocr_pdf_images(pdf_path)
            
        except Exception as e:
            logger.error(f"Erreur extraction PDF {pdf_path}: {str(e)}")
            return '', str(e)
    
    def ocr_pdf_images(self, pdf_path):
        """
        Convertit les pages PDF en images et applique l'OCR.
        
        Args:
            pdf_path (str): Chemin vers le PDF
            
        Returns:
            tuple: (texte_extrait, erreur)
        """
        try:
            # Convertir le PDF en images (Haute résolution 300 DPI)
            images = convert_from_path(pdf_path, dpi=300)
            
            text = ''
            for i, image in enumerate(images):
                logger.info(f"OCR page {i+1}/{len(images)}")
                
                # Prétraitement
                processed_image = self.preprocess_image(image)
                
                page_text = pytesseract.image_to_string(
                    processed_image,
                    lang=self.ocr_languages,
                    config='--psm 3 -c preserve_interword_spaces=1'
                )
                text += f"\n--- Page {i+1} ---\n{page_text}"
            
            return text, ''
            
        except Exception as e:
            logger.error(f"Erreur OCR PDF: {str(e)}")
            return '', str(e)
    
    def extract_from_image(self, image_path):
        """
        Extrait le texte d'une image avec Tesseract OCR.
        
        Args:
            image_path (str): Chemin vers l'image
            
        Returns:
            tuple: (texte_extrait, erreur)
        """
        try:
            image = Image.open(image_path)
            
            # Prétraitement
            processed_image = self.preprocess_image(image)
            
            text = pytesseract.image_to_string(
                processed_image,
                lang=self.ocr_languages,
                config='--psm 3 -c preserve_interword_spaces=1'
            )
            return text, ''
            
        except Exception as e:
            logger.error(f"Erreur OCR image {image_path}: {str(e)}")
            return '', str(e)
    
    def extract_from_text(self, text_path):
        """
        Lit le contenu d'un fichier texte.
        """
        try:
            with open(text_path, 'r', encoding='utf-8') as file:
                text = file.read()
            return text, ''
            
        except UnicodeDecodeError:
            try:
                with open(text_path, 'r', encoding='latin-1') as file:
                    text = file.read()
                return text, ''
            except Exception as e:
                logger.error(f"Erreur lecture fichier texte {text_path}: {str(e)}")
                return '', str(e)
        except Exception as e:
            logger.error(f"Erreur lecture fichier texte {text_path}: {str(e)}")
            return '', str(e)

    def extract_from_docx(self, docx_path):
        """
        Extrait le texte d'un fichier Word (.docx).
        """
        try:
            doc = docx.Document(docx_path)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            
            # Extraire aussi le texte des tableaux
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        full_text.append(cell.text)
            
            return '\n'.join(full_text), ''
        except Exception as e:
            logger.error(f"Erreur extraction Word {docx_path}: {str(e)}")
            return '', f"Erreur Word: {str(e)}"


def process_document_ocr(document):
    """
    Traite l'OCR pour un document donné.
    
    Args:
        document: Instance du modèle Document
    """
    processor = OCRProcessor()
    
    try:
        file_path = document.file.path
        text, error = processor.extract_text_from_file(file_path)
        
        document.ocr_text = text
        document.ocr_processed = True
        document.ocr_error = error
        document.save()
        
        logger.info(f"OCR traité pour document {document.id}: {len(text)} caractères")
        
    except Exception as e:
        logger.error(f"Erreur traitement OCR document {document.id}: {str(e)}")
        document.ocr_processed = True
        document.ocr_error = str(e)
        document.save()
