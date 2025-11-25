import jsonLogic from 'json-logic-js';
import { z } from 'zod';

const ConditionSchema = z.object({
    dependsOn: z.string().min(1),
    operator: z.enum([
        'is',
        'isNot'
    ]),
    value: z.union([
        z.string(),
        z.number(),
        z.boolean()
    ])
});
function createRulesEngine() {
    /**
   * Transforms a high-level `Condition` object into a JSON Logic-compatible condition.
   *
   * Converts operators like 'is' and 'isNot' into their JSON Logic equivalents ('==' and '!=').
   * Throws an error if the operator is not supported.
   *
   * @param condition - The condition object to convert.
   * @returns A JSON Logic AST representing the condition.
   * @throws {Error} If the operator is not recognized.
   */ const generate = (condition)=>{
        const { dependsOn, operator, value } = condition;
        const operatorsMap = {
            is: '==',
            isNot: '!='
        };
        if (!operatorsMap[operator]) {
            throw new Error(`Invalid operator: ${operator}`);
        }
        return {
            [operatorsMap[operator]]: [
                {
                    var: dependsOn
                },
                value
            ]
        };
    };
    /**
   * Validates a condition object against the `ConditionSchema`.
   *
   * Ensures that the condition adheres to the expected structure and types.
   *
   * @param condition - The condition object to validate.
   * @throws {ZodError} If the condition is invalid.
   */ const validate = (condition)=>{
        ConditionSchema.parse(condition);
    };
    /**
   * Evaluates a JSON Logic condition against provided data.
   * @throws {Error} If the condition is invalid.
   */ const evaluate = (condition, data)=>{
        try {
            return jsonLogic.apply(condition, data);
        } catch (err) {
            throw new Error(`Invalid condition: ${err.message}`);
        }
    };
    return {
        generate,
        validate,
        evaluate
    };
}

export { ConditionSchema, createRulesEngine };
//# sourceMappingURL=rulesEngine.mjs.map
