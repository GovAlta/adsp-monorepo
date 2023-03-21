from adsp_service_flask_sdk import AdspId


def test_parse():
    result = AdspId.parse("urn:ads:platform:test-service:v1")
    assert result.namespace == "platform"
    assert result.service == "test-service"
    assert result.api == "v1"
    assert result.resource is None


def test_rep():
    result = AdspId.parse("urn:ads:platform:test-service:v1:/tests")
    assert str(result) == "urn:ads:platform:test-service:v1:/tests"


def test_eq():
    x = AdspId.parse("urn:ads:platform:test-service:v1:/tests")
    y = AdspId.parse("urn:ads:platform:test-service:v1:/tests")
    z = AdspId.parse("urn:ads:platform:test-service:v1")
    assert x == y
    assert x != z
