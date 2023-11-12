import pytest

from adsp_py_common.util import destruct_list


def test_destruct():
    list = ["a", "b"]
    a, b = destruct_list(2, list)
    assert a == "a"
    assert b == "b"


def test_destruct_pad():
    list = ["a", "b"]
    a, b, c = destruct_list(3, list)
    assert a == "a"
    assert b == "b"
    assert c is None


def test_fails_for_not_list():
    with pytest.raises(Exception):
        list = "not a list"
        destruct_list(2, list)
