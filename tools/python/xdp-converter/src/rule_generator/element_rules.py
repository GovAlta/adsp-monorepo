from typing import Optional


class Rule:
    def __init__(
        self,
        effect: str,
        target: str,
        condition_value: str,
        driver: Optional[str] = None,
    ):
        self.effect = effect  # "SHOW" | "HIDE"
        self.target = target  # element being affected
        self.condition_value = (
            condition_value  # e.g., 'this.rawValue == 1', 'NOT(...)', 'ALWAYS'
        )
        self.driver = driver  # owner whose event/script this is under

    def __repr__(self):
        return f"\nRule(effect={self.effect!r}, target={self.target!r}, condition_value={self.condition_value!r}, driver={self.driver!r})"


class ElementRules:
    def __init__(self, element_name: str):
        self.element_name = element_name
        self.rules: list[Rule] = []
        self._seen: set[tuple[str, str, str, str | None]] = set()
        # key = (effect, target, condition_value, driver)

    def add_rule(self, rule: Rule) -> bool:
        key = (rule.effect, rule.target, rule.condition_value, rule.driver)
        if key in self._seen:
            return False
        self._seen.add(key)
        self.rules.append(rule)
        return True

    def __repr__(self):
        return f"ElementRules({self.element_name!r}, rules={self.rules!r})"
