import google.generativeai as genai
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

def test_gemini():
    if not API_KEY:
        print("❌ Erreur: GEMINI_API_KEY non trouvée dans .env")
        return

    print(f"Testing Gemini API with Key: {API_KEY[:5]}...")
    
    try:
        genai.configure(api_key=API_KEY)
        
        print("\n--- Modèles Disponibles (Available Models) ---")
        found = False
        candidates = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ {m.name}")
                candidates.append(m.name)
                found = True
        
        if not found:
            print("❌ Aucun modèle compatible trouvé !")
        else:
            print(f"--- Fin de la liste ({len(candidates)} modèles) ---\n")
            
        # Test avec un modèle sûr
        target_model = 'gemini-1.5-flash'
        print(f"Test tentative avec: {target_model}")
        model = genai.GenerativeModel(target_model)
        response = model.generate_content("Bonjour, es-tu opérationnel ?")
        print(f"✅ Succès ! Réponse : {response.text}")
        
    except Exception as e:
        print(f"\n❌ Erreur Technique : {str(e)}")

if __name__ == "__main__":
    test_gemini()
