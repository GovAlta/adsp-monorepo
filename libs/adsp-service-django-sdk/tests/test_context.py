import pytest
from unittest.mock import Mock, patch

from adsp_py_common.access import User
from adsp_py_common.tenant import Tenant
from adsp_service_django_sdk import get_user, get_tenant, require_user
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse

from .request import Request


settings.configure()


def test_get_user():
    user = Mock(User)
    request = Request()
    request._adsp_user = user

    result = get_user(request)
    assert result == user


def test_get_user_no_user():
    request = Request()
    request._adsp_user = None

    result = get_user(request)
    assert result is None


def test_get_tenant():
    tenant = Mock(Tenant)
    request = Request()
    request._adsp_tenant = tenant

    result = get_tenant(request)
    assert result == tenant


def test_get_tenant_no_user():
    request = Request()
    request._adsp_tenant = None

    result = get_tenant(request)
    assert result is None


def test_require_user():
    @require_user()
    def method(_):
        return "testing 123"

    with patch(
        "adsp_service_django_sdk.context.get_user",
    ) as mock_get_user:
        user = Mock(User)
        user.is_core = False
        mock_get_user.return_value = user
        method(Request())


def test_require_user_no_user():
    @require_user()
    def method(_):
        return "testing 123"

    with patch(
        "adsp_service_django_sdk.context.get_user",
    ) as mock_get_user:
        user = Mock(User)
        user.is_core = False
        mock_get_user.return_value = None
        result = method(Request())
        assert isinstance(result, HttpResponse)


def test_require_user_core_not_allowed():
    @require_user()
    def method(_):
        return "testing 123"

    with patch(
        "adsp_service_django_sdk.context.get_user",
    ) as mock_get_user, pytest.raises(PermissionDenied):
        user = Mock(User)
        user.is_core = True
        mock_get_user.return_value = user
        method(Request())


def test_require_user_core_allowed():
    @require_user(allow_core=True)
    def method(_):
        return "testing 123"

    with patch(
        "adsp_service_django_sdk.context.get_user",
    ) as mock_get_user:
        user = Mock(User)
        user.is_core = True
        mock_get_user.return_value = user
        method(Request())


def test_require_user_with_role():
    @require_user("tester")
    def method(_):
        return "testing 123"

    with patch(
        "adsp_service_django_sdk.context.get_user",
    ) as mock_get_user:
        user = Mock(User)
        user.is_core = False
        user.roles = ["tester"]
        mock_get_user.return_value = user
        method(Request())


def test_require_user_without_role():
    @require_user("tester")
    def method(_):
        return "testing 123"

    with patch(
        "adsp_service_django_sdk.context.get_user",
    ) as mock_get_user, pytest.raises(PermissionDenied):
        user = Mock(User)
        user.is_core = False
        user.roles = []
        mock_get_user.return_value = user
        method(Request())
