from typing import Any, Callable, Optional, TypeVar

from adsp_py_common.access import User
from adsp_py_common.constants import CONTEXT_TENANT, CONTEXT_USER
from adsp_py_common.tenant import Tenant
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse


RT = TypeVar("RT")


def get_user(request) -> Optional[User]:
    return getattr(request, CONTEXT_USER, None)


def get_tenant(request) -> Optional[Tenant]:
    return getattr(request, CONTEXT_TENANT, None)


def require_user(
    *args: str, allow_core: bool = False
) -> Callable[[Callable[..., RT]], Callable[..., RT]]:
    roles = [role for role in args if role]

    def decorator(func: Callable[..., RT]) -> Callable[..., RT]:
        def wrapper(*args, **kwargs) -> Any:
            user = get_user(args[0])
            if not user:
                return HttpResponse("Unauthorized", status=401)

            if user.is_core and not allow_core:
                raise PermissionDenied()

            if roles and not len(list(set(roles) & set(user.roles))):
                raise PermissionDenied()

            return func(*args, **kwargs)

        return wrapper

    return decorator
