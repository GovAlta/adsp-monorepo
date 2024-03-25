from typing import List, Optional
from presidio_analyzer import Pattern, PatternRecognizer


class CaPostalCodeRecognizer(PatternRecognizer):
    """
    Recognizes Canada postal codes using regex.
    """

    PATTERNS = [
        Pattern(
            "Canada Postal Code",
            r"\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b",
            0.6,
        )
    ]

    CONTEXT = ["address", "postal code", "mail", "letter"]

    def __init__(
        self,
        patterns: Optional[List[Pattern]] = None,
        context: Optional[List[str]] = None,
        supported_language: str = "en",
        supported_entity: str = "CA_POSTAL_CODE",
    ):
        patterns = patterns if patterns else self.PATTERNS
        context = context if context else self.CONTEXT
        super().__init__(
            supported_entity=supported_entity,
            patterns=patterns,
            context=context,
            supported_language=supported_language,
        )
