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
        self.model_name = 'gemini-1.5-flash'
        
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
        try:
            model = genai.GenerativeModel(self.model_name)
            
            # Retrieve the file reference to pass to the model
            # Note: start_chat history format is strictly [{'role': 'user', 'parts': [...]}, ...]
            # We need to make sure the file is in the history or context.
            # Best practice for Gemini 1.5 with files:
            # Pass the file in the initial history or system instruction?
            # Actually, standard way is to include the file in the request contents.
            
            # If we are using `chat = model.start_chat()`, we can initialize it.
            
            # Simple approach: Reconstruct history where the first message includes the file.
            
            # Retrieve file object (lightweight reference)
            # file_ref = genai.get_file(file_name) # This might fetch metadata
            
            # Since we can't easily "get" the object to pass to content generation without re-uploading in some versions,
            # Let's verify: yes, get_file returns a proper object usable in generation.
            
            file_ref = genai.get_file(file_name)
            
            formatted_history = []
            
            # Add file to the first user message if history is empty, OR ensure it's in the context.
            # Actually, we can just send [file_ref, message] if it's a stateless 'generate_content' call 
            # but that doesn't remember history.
            
            # For chat:
            if not history:
                # Start new chat with file
                chat = model.start_chat(history=[
                    {
                        "role": "user",
                        "parts": [file_ref, "Analyse ce document juridique. Tu es un assistant expert."]
                    },
                    {
                        "role": "model",
                        "parts": ["Bien sûr, j'ai analysé le document. Je suis prêt à répondre à vos questions."]
                    }
                ])
            else:
                # Reconstruct history
                # Note: The file object must be present in the history if we want the context.
                # However, passing the actual File object in 'parts' for history reconstruction works 
                # if the object is valid.
                
                # Since we accept history from frontend (JSON), we need to handle the file part carefully.
                # We can't re-upload. We should assume the "context" is established.
                # BUT Gemini 1.5 context caching or file lifetime implies we just need to reference it.
                
                # Alternate robust strategy: using generate_content with a list of messages + file every time?
                # No, that's token heavy if we re-send text history, but for file it's fine (pointer).
                # Cost-effective way: use chat session.
                
                # Let's try to pass the file_ref in the history.
                # We will prepend the file-loading turn to the history we receive from frontend.
                
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
                    internal_history.append({
                        "role": turn['role'],
                        "parts": turn['parts']
                    })
                
                chat = model.start_chat(history=internal_history)
                
            response = chat.send_message(message)
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini Chat Error: {str(e)}")
            raise e
