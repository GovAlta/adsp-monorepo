from typing import List, Optional
from presidio_analyzer import Pattern, PatternRecognizer


class CaBankRecognizer(PatternRecognizer):
    """
    Recognizes Canada bank account number using regex.
    """

    # Institution   ddd     first digit is not 1, 4, or 9 based on current institutions, but subject to change.
    # Branch        ddddd
    # Account               often 7 or 12 digits but institution dependent; range to allow for format characters.
    PATTERNS = [
        Pattern(
            "Canada Bank Account Number",
            r"\b[02-35-8]\d{2}[ -]?\d{5}[ -]?[\d -]{6,14}\b",
            0.6,
        )
    ]

    CONTEXT = ["bank", "transit", "branch", "account", "deposit", "transfer"]

    def __init__(
        self,
        patterns: Optional[List[Pattern]] = None,
        context: Optional[List[str]] = None,
        supported_language: str = "en",
        supported_entity: str = "CA_BANK_NUMBER",
    ):
        patterns = patterns if patterns else self.PATTERNS
        context = context if context else self.CONTEXT
        super().__init__(
            supported_entity=supported_entity,
            patterns=patterns,
            context=context,
            supported_language=supported_language,
        )
