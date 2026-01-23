from django.db import migrations

def init_permissions(apps, schema_editor):
    RolePermission = apps.get_model('users', 'RolePermission')
    
    defaults = {
        'ADMIN': {
            'can_manage_users': True,
            'can_view_fees': True, 
            'can_manage_cases': True,
            'can_delete_cases': True,
            'can_manage_documents': True,
            'can_delete_documents': True,
            'can_view_dashboard_stats': True,
            'can_access_audit_log': True
        },
        'AVOCAT': {
            'can_manage_users': False,
            'can_view_fees': True,
            'can_manage_cases': True,
            'can_delete_cases': False,
            'can_manage_documents': True,
            'can_delete_documents': True,
            'can_view_dashboard_stats': True,
            'can_access_audit_log': False
        },
        'COLLABORATEUR': {
            'can_manage_users': False,
            'can_view_fees': False,
            'can_manage_cases': True,
            'can_delete_cases': False,
            'can_manage_documents': True,
            'can_delete_documents': False,
            'can_view_dashboard_stats': False,
            'can_access_audit_log': False
        },
        'SECRETAIRE': {
            'can_manage_users': False,
            'can_view_fees': False,
            'can_manage_cases': True,
            'can_delete_cases': False,
            'can_manage_documents': True,
            'can_delete_documents': False,
            'can_view_dashboard_stats': False,
            'can_access_audit_log': False
        },
        'CLIENT': {
            'can_manage_users': False,
            'can_view_fees': False,
            'can_manage_cases': False,
            'can_delete_cases': False,
            'can_manage_documents': False,
            'can_delete_documents': False,
            'can_view_dashboard_stats': False,
            'can_access_audit_log': False
        }
    }

    for role, perms in defaults.items():
        RolePermission.objects.update_or_create(role=role, defaults={'permissions': perms})

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_rolepermission'),
    ]

    operations = [
        migrations.RunPython(init_permissions),
    ]
