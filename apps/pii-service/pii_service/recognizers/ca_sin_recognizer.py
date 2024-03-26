from typing import List, Optional, Tuple
from presidio_analyzer import Pattern, PatternRecognizer


class CaSinRecognizer(PatternRecognizer):
    """
    Recognizes Canada social insurance number using regex.
    """

    PATTERNS = [
        Pattern(
            "Canada Social Insurance Number",
            r"\b\d{3}[ -]?\d{3}[ -]?\d{3}\b",
            0.6,
        )
    ]

    CONTEXT = [
        "tax",
        "income",
        "cra",
        "canada revenue agency",
        "social insurance number",
        "sin",
    ]

    def __init__(
        self,
        patterns: Optional[List[Pattern]] = None,
        context: Optional[List[str]] = None,
        supported_language: str = "en",
        supported_entity: str = "CA_SIN",
        replacement_pairs: Optional[List[Tuple[str, str]]] = None,
    ):
        self.replacement_pairs = (
            replacement_pairs if replacement_pairs else [("-", ""), (" ", "")]
        )
        patterns = patterns if patterns else self.PATTERNS
        context = context if context else self.CONTEXT
        super().__init__(
            supported_entity=supported_entity,
            patterns=patterns,
            context=context,
            supported_language=supported_language,
        )

    def validate_result(self, pattern_text: str) -> bool:
        """
        Validate the pattern logic e.g., by running checksum on a detected pattern.

        :param pattern_text: the text to validated.
        Only the part in text that was detected by the regex engine
        :return: A bool indicating whether the validation was successful.
        """
        # Pre-processing before validation checks
        text = self.__sanitize_value(pattern_text, self.replacement_pairs)
        digit_array = [int(digit) for digit in text if not digit.isspace()]

        # Perform Luhn algorithm check
        # Double every second digit, sum digits for results > 9 (minus 9), then sum all.
        checksum = 0
        for i in range(9):
            weight = 1 if i % 2 == 0 else 2
            multiple = digit_array[i] * weight
            checksum += multiple if multiple < 10 else multiple - 9
        remainder = checksum % 10
        return remainder == 0

    @staticmethod
    def __sanitize_value(text: str, replacement_pairs: List[Tuple[str, str]]) -> str:
        for search_string, replacement_string in replacement_pairs:
            text = text.replace(search_string, replacement_string)
        return text
