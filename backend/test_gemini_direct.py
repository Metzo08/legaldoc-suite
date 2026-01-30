import google.generativeai as genai
import os
import sys

# Load API Key directly for testing
API_KEY = "AIzaSyCmc2AdPly60iqdnteqK66Arg3ULHVcFkI"

def test_gemini():
    print(f"Testing Gemini API with Key: {API_KEY[:5]}...")
    
    try:
        genai.configure(api_key=API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # 1. Simple text generation
        print("\n1. Testing Text Generation...")
        response = model.generate_content("Hello, can you hear me?")
        print(f"Success! Response: {response.text}")
        
        # 2. File Upload (Create dummy PDF if needed)
        print("\n2. Testing File Upload...")
        dummy_pdf = "test_doc.pdf"
        with open(dummy_pdf, "w") as f:
            f.write("Dummy content for testing Gemini upload.")
            
        # Note: Gemini File API expects actual files. Text file ok? 
        # Actually it supports PDF, image, text, etc.
        # Let's save a simple text file but name it .txt to be safe, or just try uploading this.
        
        try:
            uploaded_file = genai.upload_file(dummy_pdf, mime_type="text/plain")
            print(f"File uploaded: {uploaded_file.name}")
            print(f"File URI: {uploaded_file.uri}")
            
            # 3. Chat with file
            print("\n3. Testing Chat with File...")
            chat = model.start_chat(history=[
                {"role": "user", "parts": [uploaded_file, "What is this file?"]}
            ])
            chat_resp = chat.send_message("Summarize it.")
            print(f"Chat Response: {chat_resp.text}")
            
            # Cleanup
            # genai.delete_file(uploaded_file.name)
            
        except Exception as e:
            print(f"File Upload/Chat Failed: {e}")
            
    except Exception as e:
        print(f"General Error: {e}")

if __name__ == "__main__":
    test_gemini()
