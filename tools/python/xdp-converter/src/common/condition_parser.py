"""
condition_parser.py
-------------------
Lightweight, pipeline-style condition parser for Adobe XDP JavaScript snippets.
"""

from dataclasses import dataclass
import re
from typing import Optional, List


@dataclass
class ConditionAtom:
    """Represents a single comparison (driver, operator, value)."""

    driver: str
    operator: str
    value: str


class ConditionParser:
    """
    Simple tokenizer and parser for JavaScript-style comparison expressions.
    Focuses on things like:
        this.rawValue == 1
        Header.rbApplicant.rawValue != ""
        Partner.Canadian.rawValue >= 2
    """

    # --- STAGE 1: Normalize ---
    @staticmethod
    def normalize(text: str) -> str:
        """Remove JS comments and collapse whitespace."""
        if not text:
            return ""

        # Remove single-line comments
        text = re.sub(r"//.*", "", text)
        # Remove multi-line comments
        text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
        # Collapse consecutive whitespace
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    # --- STAGE 2: Split composite conditions ---
    @staticmethod
    def split_conditions(text: str) -> List[str]:
        """
        Split by '&&' and '||' for simple cases.
        (More advanced logical parsing could come later.)
        """
        if not text:
            return []
        return re.split(r"\s*(?:&&|\|\|)\s*", text)

    # --- STAGE 3: Parse atomic expressions ---
    @staticmethod
    def parse_atom(expr: str) -> Optional[ConditionAtom]:
        """
        Parse a single comparison expression like:
            Header.rbApplicant.rawValue == 1
        Returns a ConditionAtom or None.
        """
        ops = ["==", "!=", ">=", "<=", ">", "<"]
        for op in ops:
            if op in expr:
                lhs, rhs = expr.split(op, 1)
                driver = lhs.strip()
                value = rhs.strip().strip("'\"")  # remove quotes
                # Strip rawValue or trailing dots
                driver = driver.replace(".rawValue", "").strip()
                return ConditionAtom(driver=driver, operator=op, value=value)
        return None

    # --- STAGE 4: Full parse entry point ---
    @classmethod
    def parse(cls, condition_text: str) -> List[ConditionAtom]:
        """
        Full parse pipeline: normalize → split → parse each atom.
        Returns a list of ConditionAtoms.
        """
        text = cls.normalize(condition_text)
        parts = cls.split_conditions(text)
        atoms = []
        for part in parts:
            atom = cls.parse_atom(part)
            if atom:
                atoms.append(atom)
        return atoms
