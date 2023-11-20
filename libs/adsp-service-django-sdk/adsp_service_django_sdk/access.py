from adsp_py_common.tenant import Tenant
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User as UserModel

from .context import get_user


class TenantUser(UserModel):
    class Meta:
        app_label = "auth"
        proxy = True

    tenant: Tenant = None


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
                model = TenantUser(tenant=user.tenant, id=user.id, user=base)
                model.save()
        return model
