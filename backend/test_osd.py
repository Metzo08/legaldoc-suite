import pytesseract
from PIL import Image, ImageDraw, ImageFont
import re

# Create an image with text
img = Image.new('RGB', (800, 400), color='white')
d = ImageDraw.Draw(img)
d.text((50, 150), "ATTESTATION DE REJET POUR INFRACTION", fill='black')
d.text((50, 200), "DISPOSITIONS DU REGLEMENT SUR PAIEMENTS", fill='black')
d.text((50, 250), "Défaut de provision", fill='black')

# Rotate it upside down
upside_down = img.rotate(180, expand=True)

# Run OSD
try:
    osd_data = pytesseract.image_to_osd(upside_down, config='--psm 0')
    print("OSD Data:", osd_data)
    rotate_match = re.search(r'Rotate: (\d+)', osd_data)
    if rotate_match:
        print("Detected Rotate:", int(rotate_match.group(1)))
except Exception as e:
    print("OSD Error:", e)

# Run image_to_string
try:
    # default psm 3
    text = pytesseract.image_to_string(upside_down, config='--psm 3')
    print("\nText PSM 3 (No OSD):")
    print(text)
except Exception as e:
    print("OCR Error:", e)
