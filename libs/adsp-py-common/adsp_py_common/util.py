from operator import itemgetter

from more_itertools import pad_none, take


def destruct_list(count: int, value: list):
    if not isinstance(value, list):
        raise TypeError("value must be list")
    return itemgetter(*range(count))(take(count, pad_none(value)))
