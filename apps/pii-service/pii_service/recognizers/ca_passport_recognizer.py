from typing import List, Optional
from presidio_analyzer import Pattern, PatternRecognizer


class CaPassportRecognizer(PatternRecognizer):
    """
    Recognizes Canada passport number using regex.
    """

    PATTERNS = [
        Pattern(
            "Canada Passport",
            r"\bAT[0-9]{2} ?[0-9]{4} ?[0-9]{4} ?[0-9]{4} ?[0-9]{4}\b",
            0.6,
        )
    ]

    CONTEXT = ["passport", "travel", "identity"]

    def __init__(
        self,
        patterns: Optional[List[Pattern]] = None,
        context: Optional[List[str]] = None,
        supported_language: str = "en",
        supported_entity: str = "CA_PASSPORT",
    ):
        patterns = patterns if patterns else self.PATTERNS
        context = context if context else self.CONTEXT
        super().__init__(
            supported_entity=supported_entity,
            patterns=patterns,
            context=context,
            supported_language=supported_language,
        )
