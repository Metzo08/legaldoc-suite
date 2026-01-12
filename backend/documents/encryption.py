"""
Utilitaires pour le chiffrement des fichiers avec AES-256.
"""
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib


class FileEncryption:
    """
    Classe pour gérer le chiffrement et le déchiffrement des fichiers.
    """
    
    def __init__(self):
        """
        Initialise le chiffreur avec la clé de settings.
        """
        # Générer une clé Fernet à partir de la clé de configuration
        key = hashlib.sha256(settings.ENCRYPTION_KEY).digest()
        self.cipher = Fernet(base64.urlsafe_b64encode(key))
    
    def encrypt_file(self, file_content):
        """
        Chiffre le contenu d'un fichier.
        
        Args:
            file_content (bytes): Contenu du fichier en bytes
            
        Returns:
            bytes: Contenu chiffré
        """
        return self.cipher.encrypt(file_content)
    
    def decrypt_file(self, encrypted_content):
        """
        Déchiffre le contenu d'un fichier.
        
        Args:
            encrypted_content (bytes): Contenu chiffré
            
        Returns:
            bytes: Contenu déchiffré
        """
        return self.cipher.decrypt(encrypted_content)
    
    def encrypt_text(self, text):
        """
        Chiffre une chaîne de texte.
        
        Args:
            text (str): Texte à chiffrer
            
        Returns:
            str: Texte chiffré en base64
        """
        encrypted = self.cipher.encrypt(text.encode('utf-8'))
        return base64.b64encode(encrypted).decode('utf-8')
    
    def decrypt_text(self, encrypted_text):
        """
        Déchiffre une chaîne de texte.
        
        Args:
            encrypted_text (str): Texte chiffré en base64
            
        Returns:
            str: Texte déchiffré
        """
        encrypted = base64.b64decode(encrypted_text.encode('utf-8'))
        decrypted = self.cipher.decrypt(encrypted)
        return decrypted.decode('utf-8')
