from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('cabinet', '0004_cabinet_cel_cabinet_fax'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cabinet',
            name='primary_color',
            field=models.CharField(default='#1a237e', help_text='Format HEX (ex: #1a237e)', max_length=7, verbose_name='Couleur principale'),
        ),
        migrations.AlterField(
            model_name='cabinet',
            name='secondary_color',
            field=models.CharField(default='#c2185b', help_text='Format HEX (ex: #c2185b)', max_length=7, verbose_name='Couleur secondaire'),
        ),
    ]
