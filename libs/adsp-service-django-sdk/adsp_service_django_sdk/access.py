from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User as UserModel
from django.db import models

from .context import get_user


class TenantUser(models.Model):
    user = models.OneToOneField(UserModel, on_delete=models.CASCADE)
    id = models.UUIDField(primary_key=True)
    tenant = models.CharField(max_length=100)


class AccessAuthenticationBackend(BaseBackend):
    def authenticate(self, request):
        model: TenantUser = None
        user = get_user(request)
        if user and user.is_core:
            try:
                model = TenantUser.objects.get(id=user.id)
            except TenantUser.DoesNotExist:
                base = UserModel(
                    username=user.name,
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                )
                model = TenantUser(tenant=str(user.tenant.id), id=user.id, user=base)
                model.save()
        return model
