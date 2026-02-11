from django.db import models
from django.core.validators import FileExtensionValidator

class Cabinet(models.Model):
    """
    Modèle Singleton pour les informations du cabinet.
    """
    name = models.CharField("Nom du cabinet", max_length=200, default="Mon Cabinet")
    description = models.TextField("Description / Savoir-faire", blank=True)
    history = models.TextField("Historique du cabinet", blank=True, help_text="Histoire et origine du cabinet")
        
    # Branding
    logo = models.ImageField(
        "Logo", 
        upload_to='cabinet/branding/', 
        null=True, 
        blank=True,
        validators=[FileExtensionValidator(['png', 'jpg', 'jpeg', 'svg'])]
    )
    primary_color = models.CharField("Couleur principale", max_length=7, default="#1a237e", help_text="Format HEX (ex: #1a237e)")
    secondary_color = models.CharField("Couleur secondaire", max_length=7, default="#c2185b", help_text="Format HEX (ex: #c2185b)")
    
    # Contact
    address = models.TextField("Adresse", blank=True)
    phone = models.CharField("Téléphone", max_length=50, blank=True)
    fax = models.CharField("Fax", max_length=50, blank=True)
    cel = models.CharField("Mobile (Cellulaire)", max_length=50, blank=True)
    email = models.EmailField("Email de contact", blank=True)
    website = models.URLField("Site web", blank=True)
    opening_hours = models.TextField("Horaires d'ouverture", blank=True, help_text="Ex: Lundi-Vendredi: 9h-18h")
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramètres du Cabinet"
        verbose_name_plural = "Paramètres du Cabinet"

    def __str__(self):
        return self.name

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def save(self, *args, **kwargs):
        self.pk = 1 # Force usage of pk=1 to ensure Singleton
        super(Cabinet, self).save(*args, **kwargs)

class TeamMember(models.Model):
    """
    Membres de l'équipe du cabinet pour la page d'accueil.
    """
    name = models.CharField("Nom complet", max_length=100)
    role = models.CharField("Rôle / Titre", max_length=100)
    biography = models.TextField("Biographie", blank=True)
    photo = models.ImageField(
        "Photo", 
        upload_to='cabinet/team/', 
        null=True, 
        blank=True
    )
    order = models.IntegerField("Ordre d'affichage", default=0)
    is_active = models.BooleanField("Afficher sur le site", default=True)
    
    linkedin_url = models.URLField("LinkedIn", blank=True)
    email = models.EmailField("Email professionnel", blank=True)
    phone = models.CharField("Téléphone", max_length=50, blank=True)

    class Meta:
        verbose_name = "Membre de l'équipe"
        verbose_name_plural = "Équipe"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
