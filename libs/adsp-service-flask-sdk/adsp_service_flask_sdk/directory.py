import logging
from operator import attrgetter, itemgetter
from threading import Lock
from typing import Dict, Optional

from cachetools import cachedmethod, TTLCache, keys
from httpx import RequestError, get

from .adsp_id import AdspId


class ServiceDirectory:
    _logger = logging.getLogger("adsp.service-directory")
    __entry_values_getter = itemgetter("urn", "url")

    def __init__(self, directory_url: str) -> None:
        self._cache = TTLCache(100, 3600)
        self._cache_lock = Lock()
        self.__directory_url = directory_url

    def _retrieve_directory(self, namespace: str) -> Dict[AdspId, str]:
        try:
            response = get(
                f"{self.__directory_url}/directory/v2/namespaces/{namespace}/entries"
            )
            results = response.json()

            entries: Dict[str, str] = {}
            for result in results:
                try:
                    urn, service_url = self.__entry_values_getter(result)

                    entry_id = AdspId.parse(urn)
                    entries[entry_id] = service_url

                    key = keys.methodkey(self, entry_id)
                    with self._cache_lock:
                        self._cache[key] = service_url

                    self._logger.debug(
                        "Cached service directory entry %s -> %s", entry_id, service_url
                    )
                except BaseException as err:
                    self._logger.error(
                        "Error encountered caching entry '%s'; entry url may be invalid: %s. %s",
                        urn,
                        service_url,
                        err,
                    )

            self._logger.info(
                "Retrieved and cached directory entries for namespace: %s", namespace
            )
            return entries
        except RequestError as err:
            self._logger.error("Error encountered retrieving access token. %s", err)
            raise

    @cachedmethod(attrgetter('_cache'), lock=attrgetter('_cache_lock'))
    def get_service_url(self, id: AdspId) -> Optional[str]:
        return self._retrieve_directory(id.namespace).get(id, None)
