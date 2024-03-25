"""Hello unit test module."""

from pii_service.hello import hello


def test_hello():
    """Test the hello function."""
    assert hello() == "Hello pii-service"
