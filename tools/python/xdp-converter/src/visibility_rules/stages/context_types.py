from typing import NotRequired, TypeAlias, TypedDict


JsonValue: TypeAlias = (
    bool | int | float | str | list[str] | list["JsonValue"] | dict[str, "JsonValue"]
)

UISchema: TypeAlias = dict[str, JsonValue]
JsonSchemaElement: TypeAlias = dict[str, JsonValue]

JsonFormsRule: TypeAlias = JsonSchemaElement


class JsonFormsCondition(TypedDict):
    scope: str
    schema: JsonSchemaElement


class JsonFormsRuleEntry(TypedDict):
    rule: JsonFormsRule


JsonFormsRulesByTarget = dict[str, JsonFormsRuleEntry]


class SimpleSchema(TypedDict):
    properties: dict[str, JsonSchemaElement]
    required: NotRequired[list[str]]
