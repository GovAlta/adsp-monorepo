from datetime import datetime, timedelta
import logging
from operator import itemgetter
from threading import Lock
from typing import Optional

from httpx import RequestError, post

from .adsp_id import AdspId


class TokenProvider:
    _logger = logging.getLogger("adsp.token-provider")
    __response_values_getter = itemgetter("access_token", "expires_in")

    def __init__(
        self,
        access_service_url: str,
        service_id: AdspId,
        client_secret: str,
        realm="core",
    ) -> None:
        self.__token: Optional[str] = None
        self.__expires_at: Optional[datetime] = None
        self.__token_lock = Lock()
        self.__access_service_url = access_service_url
        self.__realm = realm
        self.__service_id = service_id
        self.__client_secret = client_secret

    def _get_cached_token(self) -> Optional[str]:
        with self.__token_lock:
            if (
                self.__token
                and self.__expires_at
                and datetime.now() < self.__expires_at
            ):
                return self.__token
            else:
                return None

    def _set_cached_token(self, token: str, expires_at: datetime) -> None:
        with self.__token_lock:
            self.__token = token
            self.__expires_at = expires_at

    def get_access_token(self) -> Optional[str]:
        token = self._get_cached_token()

        if token is None:
            try:
                request_data = {
                    "grant_type": "client_credentials",
                    "client_id": str(self.__service_id),
                    "client_secret": self.__client_secret,
                }
                result = post(
                    f"{self.__access_service_url}/auth/realms/{self.__realm}/protocol/openid-connect/token",
                    data=request_data,
                ).json()

                access_token, expires_in = self.__response_values_getter(result)
                if type(access_token) is str and type(expires_in) is int:
                    self._set_cached_token(
                        access_token,
                        datetime.now() + timedelta(seconds=(expires_in - 60)),
                    )

                return access_token
            except RequestError as err:
                self._logger.error("Error encountered retrieving access token. %s", err)
                raise

        return token
