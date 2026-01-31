import google.generativeai as genai
from django.conf import settings
import logging
import os

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            logger.error("GEMINI_API_KEY not found in settings")
            raise ValueError("GEMINI_API_KEY is not configured")
        
        genai.configure(api_key=self.api_key)
        self.model_name = 'gemini-2.0-flash-lite'
        
    def upload_file(self, file_path, mime_type='application/pdf'):
        """
        Uploads a file to Gemini File API.
        Returns the file object (containing uri and name).
        """
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
                
            logger.info(f"Uploading file to Gemini: {file_path}")
            file = genai.upload_file(file_path, mime_type=mime_type)
            logger.info(f"File uploaded successfully: {file.uri}")
            return file
        except Exception as e:
            logger.error(f"Error uploading file to Gemini: {str(e)}")
            raise e

    def get_file(self, file_name):
        """
        Retrieves a file by name (e.g. 'files/...')
        """
        return genai.get_file(file_name)

    def generate_content(self, file_uri, prompt):
        """
        Generates content from a file and a prompt.
        This is for single-turn interactions.
        """
        model = genai.GenerativeModel(self.model_name)
        # We can't pass the file object directly if we only have the URI, 
        # but the python SDK usually wants the file object or we use the file API to get it back?
        # Actually in recent genericai versions, we can pass [file, prompt].
        
        # NOTE: In the Python SDK, you typically pass the uploaded file object returned by upload_file,
        # or you can look it up by name if you didn't keep the object.
        # Ideally the caller passes the full file object, but REST APIs are stateless.
        # We might need to store the 'name' (files/...) on the client or server.
        pass

    def chat_with_document(self, file_name, history, message):
        """
        Continues a chat session.
        file_name: The resource name of the uploaded file (e.g., 'files/abc-123')
        history: List of dicts [{'role': 'user', 'parts': ['...']}, {'role': 'model', 'parts': ['...']}]
        message: The new user message string.
        """
        import time
        
        SYSTEM_INSTRUCTION = """
        Tu es un Avocat Expert au Barreau du Sénégal. 
        Ton rôle est d'assister les avocats en analysant les dossiers juridiques avec une extrême précision.
        
        Règles fondamentales :
        1. Tu maîtrises parfaitement le Droit Sénégalais : Code des Obligations Civiles et Commerciales (COCC), Code Pénal, Code de Procédure Pénale, Code du Travail, Code de la Famille, et le Droit OHADA.
        2. Base toujours tes réponses sur les articles de loi sénégalais ou communautaires (OHADA) pertinents. Cite les articles.
        3. Adopte un ton professionnel, confraternel et juridique.
        4. Si le document est un pdf/image, analyse le contenu extrait.
        5. Ne donne pas de conseils génériques, sois spécifique au contexte juridique du Sénégal.
        """

        retries = 3
        last_error = None
        
        for attempt in range(retries):
            try:
                # Pass system instruction to model constructor if supported by SDK version,
                # otherwise we inject it in history.
                # Assuming google-generativeai >= 0.3.0 which supports system_instruction
                try:
                   model = genai.GenerativeModel(self.model_name, system_instruction=SYSTEM_INSTRUCTION)
                except TypeError:
                   # Fallback for older SDKs
                   model = genai.GenerativeModel(self.model_name)
                   # Logic below handles context injection manually if needed, but SDK update recommended.
                
                file_ref = genai.get_file(file_name)
                
                # Check file state
                if file_ref.state.name == "FAILED":
                    raise ValueError(f"File processing failed on Gemini side: {file_ref.uri}")
                
                internal_history = []
                
                if not history:
                    # Start new chat with file
                    # File is added to the first message context
                    internal_history = [
                        {
                            "role": "user",
                            "parts": [file_ref, "Analyse ce document pour moi, Confrère."]
                        },
                        {
                            "role": "model",
                            "parts": ["Bien sûr, cher Confrère. J'ai pris connaissance du document. En ma qualité d'expert en droit sénégalais, je suis à votre disposition pour l'analyser."]
                        }
                    ]
                else:
                    # Reconstruct history
                    # We inject the file reference in the 'phantom' first turn to provide context
                    internal_history = [
                         {
                            "role": "user",
                            "parts": [file_ref, "Contexte du dossier."]
                        },
                        {
                            "role": "model",
                            "parts": ["Dossier chargé."]
                        }
                    ]
                    
                    # Append user history (text only)
                    for turn in history:
                        parts = turn.get('parts', [])
                        if isinstance(parts, str):
                            parts = [parts]
                        
                        internal_history.append({
                            "role": turn['role'],
                            "parts": parts
                        })
                
                logger.debug(f"Starting chat match (Attempt {attempt+1}/{retries})")
                chat = model.start_chat(history=internal_history)
                response = chat.send_message(message)
                return response.text
                
            except Exception as e:
                last_error = e
                logger.warning(f"Gemini Chat verification failed (Attempt {attempt+1}): {str(e)}")
                if "429" in str(e) or "500" in str(e) or "503" in str(e):
                    time.sleep(2 * (attempt + 1)) # Backoff
                    continue
                else:
                    # Fatal error (like 403, 400)
                    raise e
                    
        # If loop finishes
        logger.error(f"Gemini Chat Failed after {retries} retries: {str(last_error)}")
        raise last_error
